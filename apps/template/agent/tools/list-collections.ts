import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchCollections } from "../../lib/shopify/catalog/server";

export default defineTool({
  description: "List this store's collection handles, titles and descriptions.",
  inputSchema: z.strictObject({}),
  execute: async () => ({
    collections: (await fetchCollections()).map(({ description, handle, title }) => ({
      description,
      handle,
      title,
    })),
  }),
});
