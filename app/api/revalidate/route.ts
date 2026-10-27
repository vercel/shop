import crypto from "node:crypto";

import { revalidateTag } from "next/cache";
import { z } from "zod";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

const REVALIDATE_TAGS = z.array(z.string().min(1).max(256)).min(1).max(20);

function isAuthorized(header: string | null, secret: string): boolean {
  // Hashing both values gives timingSafeEqual the equal-length inputs it requires.
  const digest = (value: string) => crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(digest(header ?? ""), digest(`Bearer ${secret}`));
}

export async function POST(request: Request) {
  if (!REVALIDATE_SECRET) return new Response(null, { status: 404 });

  if (!isAuthorized(request.headers.get("authorization"), REVALIDATE_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = REVALIDATE_TAGS.safeParse(new URL(request.url).searchParams.getAll("tag"));
  if (!parsed.success) {
    return Response.json({ error: "Pass 1 to 20 tag parameters" }, { status: 400 });
  }

  const tags = [...new Set(parsed.data)];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
