// @ts-nocheck
import * as __fd_glob_24 from "../content/docs/anatomy/pages/plp.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/anatomy/pages/pdp.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/anatomy/pages/index.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/anatomy/pages/home.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/anatomy/pages/content.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/anatomy/navigation.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/anatomy/index.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/anatomy/cart.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/skills/index.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/skills/enable-shopify-markets.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/skills/enable-shopify-cms.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/skills/enable-shopify-auth.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/skills/enable-content-negotiation.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/shopify/pdp.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/shopify/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/writing-shopify-queries.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/storefront-api.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/getting-started.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/env-vars.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/anatomy/pages/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/shopify/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/skills/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/anatomy/meta.json?collection=docs"
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

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "anatomy/meta.json": __fd_glob_1, "skills/meta.json": __fd_glob_2, "shopify/meta.json": __fd_glob_3, "anatomy/pages/meta.json": __fd_glob_4, }, {"env-vars.mdx": __fd_glob_5, "getting-started.mdx": __fd_glob_6, "index.mdx": __fd_glob_7, "storefront-api.mdx": __fd_glob_8, "writing-shopify-queries.mdx": __fd_glob_9, "shopify/index.mdx": __fd_glob_10, "shopify/pdp.mdx": __fd_glob_11, "skills/enable-content-negotiation.mdx": __fd_glob_12, "skills/enable-shopify-auth.mdx": __fd_glob_13, "skills/enable-shopify-cms.mdx": __fd_glob_14, "skills/enable-shopify-markets.mdx": __fd_glob_15, "skills/index.mdx": __fd_glob_16, "anatomy/cart.mdx": __fd_glob_17, "anatomy/index.mdx": __fd_glob_18, "anatomy/navigation.mdx": __fd_glob_19, "anatomy/pages/content.mdx": __fd_glob_20, "anatomy/pages/home.mdx": __fd_glob_21, "anatomy/pages/index.mdx": __fd_glob_22, "anatomy/pages/pdp.mdx": __fd_glob_23, "anatomy/pages/plp.mdx": __fd_glob_24, });