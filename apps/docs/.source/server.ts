// @ts-nocheck
import * as __fd_glob_19 from "../content/docs/skills/index.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/skills/enable-shopify-markets.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/skills/enable-shopify-cms.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/skills/enable-shopify-auth.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/skills/enable-content-negotiation.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/pages/plp.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/pages/pdp.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/pages/index.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/pages/home.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/pages/content.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/pages/cart.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/shopify/pdp.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/shopify/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/getting-started.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/env-vars.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/skills/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/shopify/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/pages/meta.json?collection=docs"
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

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "pages/meta.json": __fd_glob_1, "shopify/meta.json": __fd_glob_2, "skills/meta.json": __fd_glob_3, }, {"env-vars.mdx": __fd_glob_4, "getting-started.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "shopify/index.mdx": __fd_glob_7, "shopify/pdp.mdx": __fd_glob_8, "pages/cart.mdx": __fd_glob_9, "pages/content.mdx": __fd_glob_10, "pages/home.mdx": __fd_glob_11, "pages/index.mdx": __fd_glob_12, "pages/pdp.mdx": __fd_glob_13, "pages/plp.mdx": __fd_glob_14, "skills/enable-content-negotiation.mdx": __fd_glob_15, "skills/enable-shopify-auth.mdx": __fd_glob_16, "skills/enable-shopify-cms.mdx": __fd_glob_17, "skills/enable-shopify-markets.mdx": __fd_glob_18, "skills/index.mdx": __fd_glob_19, });