const items = [
  {
    title: "Cache invalidation",
    description:
      "Product, collection, and cart data stay fresh without hand-rolled revalidation.",
  },
  {
    title: "Consent management",
    description:
      "GDPR, CCPA, and Shopify's consent primitives wired into the storefront.",
  },
  {
    title: "Analytics instrumentation",
    description:
      "Commerce events, page views, and attribution piped through without glue code.",
  },
  {
    title: "Cart state management",
    description:
      "Optimistic updates, persistence, and sync with Shopify — handled.",
  },
  {
    title: "Checkout redirect handling",
    description:
      "Seamless handoff to Shopify Checkout and return trip back to the storefront.",
  },
  {
    title: "Multi-market routing",
    description:
      "Locale, currency, and market detection with next-intl and Shopify Markets.",
  },
];

export const WhatYouSkip = () => (
  <section className="flex flex-col gap-10 px-8 py-12 sm:px-12 sm:py-16">
    <div className="grid max-w-2xl gap-4">
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl lg:text-[40px]">
        What you don't have to build
      </h2>
      <p className="text-balance text-lg text-muted-foreground">
        The hard problems headless teams burn months on — solved out of the
        box. What takes 6 months to architect from scratch ships in days with
        Vercel Shop.
      </p>
    </div>
    <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.title} className="grid gap-1">
          <p className="font-medium tracking-tight dark:text-white">
            {item.title}
          </p>
          <p className="text-muted-foreground">{item.description}</p>
        </li>
      ))}
    </ul>
  </section>
);
