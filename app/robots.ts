import type { MetadataRoute } from "next";

import { shopConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
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
        userAgent: "*",
      },
    ],
    sitemap: `${shopConfig.site.url}/sitemap.xml`,
  };
}
