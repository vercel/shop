import { revalidateTag } from "next/cache";

export async function POST() {
  revalidateTag("tmp", "max");
  return Response.json({ revalidated: true });
}
