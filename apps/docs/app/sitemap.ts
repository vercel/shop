import type { MetadataRoute } from "next";
import { docs } from "@/lib/fromsrc/content";

const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const baseUrl = `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;

export const revalidate = false;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string): string => new URL(path, baseUrl).toString();

  const allDocs = await docs.getAllDocs();

  const pages: MetadataRoute.Sitemap = allDocs.map((doc) => ({
    changeFrequency: "weekly" as const,
    priority: 0.5,
    url: url(doc.slug ? `/docs/${doc.slug}` : "/docs"),
  }));

  return [
    {
      changeFrequency: "monthly",
      priority: 1,
      url: url("/"),
    },
    ...pages,
  ];
}
