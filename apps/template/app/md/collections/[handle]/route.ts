import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getCollection,
} from "@/lib/collections/server";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { notFoundMarkdown } from "@/lib/markdown/not-found";
import { markdownHeaders } from "@/lib/markdown/representation";

// Opts the handler into the stored-output model; every handle renders on demand and is kept until its tag is invalidated.
export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const pathname = `/collections/${handle}`;
  try {
    const collection =
      handle === ALL_PRODUCTS_HANDLE
        ? await getAllProductsCollection()
        : await getCollection({ handle });
    if (!collection) {
      return new Response(notFoundMarkdown({ kind: "Collection", value: handle }), {
        status: 404,
        headers: markdownHeaders({
          cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }
    return new Response(collectionToMarkdown(collection), {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname,
      }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the collection. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname,
        }),
      },
    );
  }
}
