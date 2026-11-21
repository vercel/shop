import { shopConfig } from "@/lib/config";

function buildSiteSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      logo: `${shopConfig.site.url}/icons/icon-512.png`,
      name: shopConfig.site.name,
      url: shopConfig.site.url,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      inLanguage: shopConfig.localization.locale,
      name: shopConfig.site.name,
      potentialAction: {
        "@type": "SearchAction",
        "query-input": "required name=search_term_string",
        target: `${shopConfig.site.url}/search?q={search_term_string}`,
      },
      url: shopConfig.site.url,
    },
  ];
}

export function SiteSchema() {
  const schemas = buildSiteSchema();
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
