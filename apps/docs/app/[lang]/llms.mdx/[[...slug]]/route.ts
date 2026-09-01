import { createDocsMarkdownRoute } from "@vercel/geistdocs/routes/llms";

import { config } from "@/lib/geistdocs/config";
import { geistdocsSource } from "@/lib/geistdocs/source";

const docsMarkdownRoute = createDocsMarkdownRoute({
  config,
  sources: [geistdocsSource],
});

export const generateStaticParams = docsMarkdownRoute.generateStaticParams;

export const GET: typeof docsMarkdownRoute.GET = async (request, context) => {
  const response = await docsMarkdownRoute.GET(request, context);
  const link = response.headers.get("Link");
  const canonicalMatch = link?.match(/^<([^>]+)>;\s*rel="canonical"$/);

  if (!canonicalMatch || !config.siteUrl) {
    return response;
  }

  const requestCanonical = new URL(canonicalMatch[1]);

  if (requestCanonical.origin !== new URL(request.url).origin) {
    return response;
  }

  const canonical = new URL(
    `${requestCanonical.pathname}${requestCanonical.search}${requestCanonical.hash}`,
    config.siteUrl,
  );
  const headers = new Headers(response.headers);
  headers.set("Link", `<${canonical.toString()}>; rel="canonical"`);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};
