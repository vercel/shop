import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import { localSearch } from "fromsrc";
import { createTools } from "./tools";
import type { MyUIMessage } from "./types";
import { createSystemPrompt } from "./utils";
import { docs } from "@/lib/fromsrc/content";

export const maxDuration = 800;

interface RequestBody {
  currentRoute: string;
  messages: MyUIMessage[];
  pageContext?: {
    title: string;
    url: string;
    content: string;
  };
}

const MAX_PAGE_CONTEXT_CHARS = 8000;
const MAX_SEARCH_CONTEXT_RESULTS = 3;

const trimPageContext = (value: string) => {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= MAX_PAGE_CONTEXT_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_PAGE_CONTEXT_CHARS)}...`;
};

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getPageContextFromRoute = async (
  currentRoute: string
): Promise<RequestBody["pageContext"] | undefined> => {
  if (!currentRoute?.startsWith("/docs")) {
    return undefined;
  }

  const pathname = currentRoute.split(/[?#]/)[0] ?? currentRoute;
  const normalized = pathname.replace(/^\/docs\/?/, "");
  const slugParts = normalized.split("/").filter(Boolean);
  const doc = await docs.getDoc(slugParts);

  if (!doc) {
    return undefined;
  }

  const pageContent = [doc.description, doc.content]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: doc.title,
    url: pathname || "/docs",
    content: trimPageContext(pageContent),
  };
};

const getLastUserQuestion = (messages: MyUIMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
    if (text.length > 0) {
      return text;
    }
  }
  return "";
};

const getPageContextFromQuery = async (
  query: string
): Promise<RequestBody["pageContext"] | undefined> => {
  if (!query) {
    return undefined;
  }

  const searchDocs = await docs.getSearchDocs();
  let results = await localSearch.search(
    query,
    searchDocs,
    MAX_SEARCH_CONTEXT_RESULTS
  );
  if (results.length === 0) {
    const queryNormalized = normalizeSearchText(query);
    const terms = queryNormalized.split(" ").filter((term) => term.length >= 3);

    const ranked = searchDocs
      .map((doc) => {
        const title = normalizeSearchText(doc.title);
        const description = normalizeSearchText(doc.description ?? "");
        const content = normalizeSearchText(doc.content);
        let score = 0;

        if (title.includes(queryNormalized)) score += 20;
        if (description.includes(queryNormalized)) score += 12;
        if (content.includes(queryNormalized)) score += 6;

        for (const term of terms) {
          if (title.includes(term)) score += 6;
          if (description.includes(term)) score += 4;
          if (content.includes(term)) score += 1;
        }

        return { doc, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SEARCH_CONTEXT_RESULTS);

    results = ranked.map(({ doc }) => ({
      doc,
      anchor: undefined,
      heading: undefined,
      snippet: doc.content.slice(0, 320),
    }));
  }

  if (results.length === 0) {
    return undefined;
  }

  const content = results
    .map(({ doc, heading, snippet, anchor }) => {
      const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
      const sourceUrl = anchor ? `${url}#${anchor}` : url;
      return [
        `Title: ${doc.title}`,
        `URL: ${sourceUrl}`,
        heading ? `Heading: ${heading}` : undefined,
        doc.description ? `Description: ${doc.description}` : undefined,
        `Snippet: ${snippet}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return {
    title: "Relevant docs context",
    url: "/docs",
    content: trimPageContext(content),
  };
};

export async function POST(req: Request) {
  try {
    const { messages, currentRoute, pageContext }: RequestBody = await req.json();
    // Filter out UI-only page context messages (they're just visual feedback)
    const actualMessages = messages.filter(
      (msg) => !msg.metadata?.isPageContext
    );
    const latestUserQuestion = getLastUserQuestion(actualMessages);
    const resolvedPageContext =
      pageContext ??
      (await getPageContextFromRoute(currentRoute)) ??
      (await getPageContextFromQuery(latestUserQuestion));

    // Prepend docs context (client-provided, route-derived, or query-derived) to the latest user message.
    let processedMessages = actualMessages;

    if (resolvedPageContext && actualMessages.length > 0) {
      const lastMessage = actualMessages.at(-1);

      if (!lastMessage) {
        return new Response(
          JSON.stringify({
            error: "No last message found",
          }),
          { status: 500 }
        );
      }

      if (lastMessage.role === "user") {
        // Extract text content from the message parts
        const userQuestion = lastMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");

        processedMessages = [
          ...actualMessages.slice(0, -1),
          {
            ...lastMessage,
            parts: [
              {
                type: "text",
                text: `Here's documentation context to help answer the question:

**Context:** ${resolvedPageContext.title}
**URL:** ${resolvedPageContext.url}

---

${resolvedPageContext.content}

---

User question: ${userQuestion}`,
              },
            ],
          },
        ];
      }
    }

    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const result = streamText({
          model: "openai/gpt-4.1-mini",
          messages: await convertToModelMessages(processedMessages),
          stopWhen: stepCountIs(10),
          tools: createTools(writer),
          system: createSystemPrompt(currentRoute),
          prepareStep: ({ stepNumber }) => {
            if (stepNumber === 0) {
              return { toolChoice: { type: "tool", toolName: "search_docs" } };
            }
          },
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("AI chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
