import { type ToolSet, tool, type UIMessageStreamWriter } from "ai";
import { localSearch } from "fromsrc";
import z from "zod";
import { docs } from "@/lib/fromsrc/content";

const log = (message: string) => {
  console.log(`🤖 [fromsrc] ${message}`);
};

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const lexicalFallbackSearch = async (query: string, limit = 8) => {
  const queryNormalized = normalizeSearchText(query);
  const terms = queryNormalized.split(" ").filter((term) => term.length >= 3);

  if (!queryNormalized) {
    return [];
  }

  const searchDocs = await docs.getSearchDocs();
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
    .slice(0, limit);

  return ranked.map(({ doc, score }) => ({
    doc,
    anchor: undefined,
    heading: undefined,
    snippet: doc.content.slice(0, 320),
    score,
  }));
};

const search_docs = (writer: UIMessageStreamWriter) =>
  tool({
    description: "Search through documentation content by query",
    inputSchema: z.object({
      query: z.string().describe("Search query to find relevant documentation"),
    }),
    execute: async ({ query }) => {
      try {
        log(`Searching docs for: ${query}`);

        const searchDocs = await docs.getSearchDocs();
        let results = await localSearch.search(query, searchDocs, 8);
        if (results.length === 0) {
          log(`No localSearch results for "${query}", running lexical fallback`);
          results = await lexicalFallbackSearch(query, 8);
        }
        log(`Found ${results.length} results`);

        if (results.length === 0) {
          return `No documentation found for query: "${query}"`;
        }

        for (const [index, result] of results.entries()) {
          const { doc, anchor } = result;
          const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
          const sourceUrl = anchor ? `${url}#${anchor}` : url;
          writer.write({
            type: "source-url",
            sourceId: `doc-${index}-${sourceUrl}`,
            url: sourceUrl,
            title: doc.title,
          });
        }

        const formatted = results
          .map(({ doc, snippet, heading, anchor }) => {
            const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
            const sourceUrl = anchor ? `${url}#${anchor}` : url;
            return `**${doc.title}**\nURL: ${sourceUrl}\n${heading ? `Heading: ${heading}\n` : ""}${doc.description ?? ""}\n\n${snippet}\n\n---\n`;
          })
          .join("\n");

        return `Found ${results.length} documentation pages for "${query}":\n\n${formatted}`;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return `Error processing results: ${message}`;
      }
    },
  });

const get_doc_page = tool({
  description:
    'Get the full content of a specific documentation page by slug path (e.g., "getting-started", "anatomy/cart")',
  inputSchema: z.object({
    slug: z
      .string()
      .describe(
        "The slug/path of the documentation page to retrieve"
      ),
  }),
  execute: async ({ slug }) => {
    log(`Getting doc page for: ${slug}`);

    // Normalize slug — remove /docs/ prefix if present
    const normalized = slug.replace(/^\/docs\/?/, "");
    const slugParts = normalized.split("/").filter(Boolean);
    const doc = await docs.getDoc(slugParts);

    if (!doc) {
      return `Documentation page not found: "${slug}"`;
    }

    return `# ${doc.title}\n\n${doc.description ? `${doc.description}\n\n` : ""}${doc.content}`;
  },
});

const list_docs = tool({
  description: "Get a list of all available documentation pages",
  inputSchema: z.object({}),
  execute: async () => {
    log("Listing all docs");
    const allDocs = await docs.getAllDocs();

    const docsList = allDocs
      .map((doc) => {
        const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
        return `- **${doc.title}** (${url}): ${doc.description ?? ""}`;
      })
      .join("\n");

    return `Available Documentation Pages (${allDocs.length} total):\n\n${docsList}`;
  },
});

export const createTools = (writer: UIMessageStreamWriter) =>
  ({
    get_doc_page,
    list_docs,
    search_docs: search_docs(writer),
  }) satisfies ToolSet;
