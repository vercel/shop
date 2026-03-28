import { Feed } from "feed";
import { title } from "@/geistdocs";
import { docs } from "@/lib/fromsrc/content";

const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const baseUrl = `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;

export const revalidate = false;

export async function GET() {
  const feed = new Feed({
    title,
    id: baseUrl,
    link: baseUrl,
    language: "en",
    copyright: `All rights reserved ${new Date().getFullYear()}, Vercel`,
  });

  const allDocs = await docs.getAllDocs();

  for (const page of allDocs) {
    const url = page.slug ? `/docs/${page.slug}` : "/docs";
    feed.addItem({
      id: url,
      title: page.title,
      description: page.description,
      link: `${baseUrl}${url}`,
      date: new Date(),
      author: [{ name: "Vercel" }],
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml",
    },
  });
}
