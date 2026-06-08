import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

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
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
