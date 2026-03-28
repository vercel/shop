import { type ToolSet, tool, type UIMessageStreamWriter } from "ai";
import z from "zod";
import { docs } from "@/lib/fromsrc/content";

const log = (message: string) => {
  console.log(`🤖 [fromsrc] ${message}`);
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
        const queryLower = query.toLowerCase();

        // Simple relevance scoring: title match > description match > content match
        const scored = searchDocs
          .map((doc) => {
            let score = 0;
            const titleLower = doc.title.toLowerCase();
            const descLower = (doc.description ?? "").toLowerCase();
            const contentLower = doc.content.toLowerCase();

            if (titleLower.includes(queryLower)) score += 10;
            if (descLower.includes(queryLower)) score += 5;
            if (contentLower.includes(queryLower)) score += 1;

            // Boost for individual query words
            for (const word of queryLower.split(/\s+/)) {
              if (titleLower.includes(word)) score += 3;
              if (descLower.includes(word)) score += 2;
              if (contentLower.includes(word)) score += 1;
            }

            return { doc, score };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        log(`Found ${scored.length} results`);

        if (scored.length === 0) {
          return `No documentation found for query: "${query}"`;
        }

        for (const [index, { doc }] of scored.entries()) {
          const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
          writer.write({
            type: "source-url",
            sourceId: `doc-${index}-${url}`,
            url,
            title: doc.title,
          });
        }

        const formatted = scored
          .map(({ doc }) => {
            const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
            return `**${doc.title}**\nURL: ${url}\n${doc.description ?? ""}\n\n${doc.content.slice(0, 1500)}${doc.content.length > 1500 ? "..." : ""}\n\n---\n`;
          })
          .join("\n");

        return `Found ${scored.length} documentation pages for "${query}":\n\n${formatted}`;
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
