import { shopConfig } from "@/shop.config";

function buildSiteSchema(locale: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: shopConfig.site.name,
      url: shopConfig.site.url,
      logo: `${shopConfig.site.url}/og-default.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: shopConfig.site.name,
      url: shopConfig.site.url,
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: `${shopConfig.site.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function SiteSchema({ locale }: { locale: string }) {
  const schemas = buildSiteSchema(locale);
  return (
    <>
      {schemas.map((schema) => (
        <script key={schema["@type"]} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </>
  );
}
