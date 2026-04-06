import { type ToolSet, tool, type UIMessageStreamWriter } from "ai";
import { localSearch } from "fromsrc";
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
        const results = await localSearch.search(query, searchDocs, 8);
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
