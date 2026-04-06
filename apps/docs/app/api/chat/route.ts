import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
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

export async function POST(req: Request) {
  try {
    const { messages, currentRoute, pageContext }: RequestBody =
      await req.json();
    const resolvedPageContext =
      pageContext ?? (await getPageContextFromRoute(currentRoute));

    // Filter out UI-only page context messages (they're just visual feedback)
    const actualMessages = messages.filter(
      (msg) => !msg.metadata?.isPageContext
    );

    // Prepend page context (client-provided or route-derived) to the latest user message.
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
                text: `Here's the content from the current page:

**Page:** ${resolvedPageContext.title}
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
