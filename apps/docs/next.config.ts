import { createGeistdocs } from "@vercel/geistdocs/next";
import type { NextConfig } from "next";

const withGeistdocs = createGeistdocs();

const config: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        as: "*.css",
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default withGeistdocs(config);
