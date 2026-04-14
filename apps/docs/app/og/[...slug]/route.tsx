import type { NextRequest } from "next/server";
import { docs } from "@/lib/fromsrc/content";
import { createOgImageResponse } from "@/lib/og";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  // Last segment is "image.png", strip it
  const docSlug = slug.slice(0, -1);
  const doc = await docs.getDoc(docSlug);

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const { title, description } = doc;

  return createOgImageResponse({ title, description });
}

export async function generateStaticParams() {
  const allDocs = await docs.getAllDocs();
  return allDocs.map((doc) => ({
    slug: [...(doc.slug ? doc.slug.split("/") : []), "image.png"],
  }));
}
