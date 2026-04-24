interface Capability {
  title: string;
  description: string;
}

interface CapabilityGroup {
  heading: string;
  capabilities: Capability[];
}

const groups: CapabilityGroup[] = [
  {
    heading: "Checkout & payments",
    capabilities: [
      {
        title: "Shopify Checkout",
        description: "The highest-converting checkout in commerce.",
      },
      {
        title: "Shop Pay",
        description: "Accelerated checkout with 100M+ buyers already opted in.",
      },
      {
        title: "Shopify Payments",
        description:
          "A fully-managed payments stack — no PSP integration required.",
      },
    ],
  },
  {
    heading: "Commerce backend",
    capabilities: [
      {
        title: "Product catalog",
        description:
          "Full catalog, inventory, and merchandising via the Storefront API.",
      },
      {
        title: "Cart & order management",
        description:
          "Carts, orders, and post-purchase flows handled by Shopify.",
      },
      {
        title: "Analytics & consent",
        description:
          "Purpose-built SDK primitives for analytics and consent management.",
      },
      {
        title: "Shopify Markets",
        description:
          "Multi-currency, multi-language, and region-aware routing out of the box.",
      },
    ],
  },
];

export const CommerceEngine = () => (
  <section className="flex flex-col gap-10 px-8 py-12 sm:px-12 sm:py-16">
    <div className="grid max-w-2xl gap-4">
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl lg:text-[40px]">
        Powered by Shopify
      </h2>
      <p className="text-balance text-lg text-muted-foreground">
        The commerce engine behind the storefront. Vercel Shop ships with
        Shopify's checkout, payments, and backend wired in — so you focus on the
        experience, not the plumbing.
      </p>
    </div>

    <div className="grid gap-10 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-5">
          <h3 className="font-sans font-semibold text-base tracking-tight text-muted-foreground uppercase">
            {group.heading}
          </h3>
          <ul className="grid gap-5">
            {group.capabilities.map((capability) => (
              <li key={capability.title} className="grid gap-1">
                <p className="font-medium tracking-tight dark:text-white">
                  {capability.title}
                </p>
                <p className="text-muted-foreground">
                  {capability.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);
