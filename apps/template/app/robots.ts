import type { MetadataRoute } from "next";

import { shopConfig } from "@/shop.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/account",
          "/login",
          "/search",
          "/*/cart",
          "/*/account",
          "/*/login",
          "/*/search",
          "/collections/*?*sort=",
          "/collections/*?*filter.",
          "/*/collections/*?*sort=",
          "/*/collections/*?*filter.",
        ],
      },
    ],
    sitemap: `${shopConfig.site.url}/sitemap.xml`,
  };
}
