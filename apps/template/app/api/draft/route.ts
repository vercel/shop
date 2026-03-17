import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

const DRAFT_SECRET = process.env.CMS_DRAFT_MODE_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");
  const disable = searchParams.get("disable");

  if (!DRAFT_SECRET) {
    return new Response("CMS draft mode secret not configured", {
      status: 500,
    });
  }

  if (secret !== DRAFT_SECRET) {
    return new Response("Invalid secret", { status: 401 });
  }

  const draft = await draftMode();

  if (disable === "true") {
    draft.disable();
    const redirectUrl = slug ? `/pages/${slug}` : "/";
    redirect(redirectUrl);
  }

  draft.enable();

  const redirectUrl = slug ? `/pages/${slug}` : "/";
  redirect(redirectUrl);
}
