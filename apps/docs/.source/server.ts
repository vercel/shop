// @ts-nocheck
import * as __fd_glob_7 from "../content/docs/skills/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/skills/enable-markets.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/shopify/pdp.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/shopify/index.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/getting-started.mdx?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/skills/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
} & {
  DocData: {
    docs: {
      /**
       * Last modified date of document file, obtained from version control.
       *
       */
      lastModified?: Date;
    },
  }
}>({"doc":{"passthroughs":["extractedReferences","lastModified"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "skills/meta.json": __fd_glob_1, }, {"getting-started.mdx": __fd_glob_2, "index.mdx": __fd_glob_3, "shopify/index.mdx": __fd_glob_4, "shopify/pdp.mdx": __fd_glob_5, "skills/enable-markets.mdx": __fd_glob_6, "skills/index.mdx": __fd_glob_7, });