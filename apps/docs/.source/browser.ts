// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
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
}>();
const browserCollections = {
  docs: create.doc("docs", {"env-vars.mdx": () => import("../content/docs/env-vars.mdx?collection=docs"), "getting-started.mdx": () => import("../content/docs/getting-started.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "anatomy/cart.mdx": () => import("../content/docs/anatomy/cart.mdx?collection=docs"), "anatomy/index.mdx": () => import("../content/docs/anatomy/index.mdx?collection=docs"), "anatomy/navigation.mdx": () => import("../content/docs/anatomy/navigation.mdx?collection=docs"), "shopify/index.mdx": () => import("../content/docs/shopify/index.mdx?collection=docs"), "shopify/pdp.mdx": () => import("../content/docs/shopify/pdp.mdx?collection=docs"), "skills/enable-content-negotiation.mdx": () => import("../content/docs/skills/enable-content-negotiation.mdx?collection=docs"), "skills/enable-shopify-auth.mdx": () => import("../content/docs/skills/enable-shopify-auth.mdx?collection=docs"), "skills/enable-shopify-cms.mdx": () => import("../content/docs/skills/enable-shopify-cms.mdx?collection=docs"), "skills/enable-shopify-markets.mdx": () => import("../content/docs/skills/enable-shopify-markets.mdx?collection=docs"), "skills/index.mdx": () => import("../content/docs/skills/index.mdx?collection=docs"), "anatomy/pages/content.mdx": () => import("../content/docs/anatomy/pages/content.mdx?collection=docs"), "anatomy/pages/home.mdx": () => import("../content/docs/anatomy/pages/home.mdx?collection=docs"), "anatomy/pages/index.mdx": () => import("../content/docs/anatomy/pages/index.mdx?collection=docs"), "anatomy/pages/pdp.mdx": () => import("../content/docs/anatomy/pages/pdp.mdx?collection=docs"), "anatomy/pages/plp.mdx": () => import("../content/docs/anatomy/pages/plp.mdx?collection=docs"), }),
};
export default browserCollections;