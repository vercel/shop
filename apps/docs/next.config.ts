import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  outputFileTracingIncludes: {
    // fromsrc reads markdown files directly from content/docs at runtime.
    // Ensure serverless API routes bundle those files in preview/prod.
    "/api/chat": ["./content/docs/**/*"],
    "/api/chat/route": ["./content/docs/**/*"],
    "/api/search": ["./content/docs/**/*"],
    "/api/search/route": ["./content/docs/**/*"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "vercel.com",
      },
    ],
  },
};

export default config;
