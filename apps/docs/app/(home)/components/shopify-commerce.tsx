interface Column {
  title: string;
  items: string[];
}

const columns: Column[] = [
  {
    title: "Checkout and Payments",
    items: [
      "Shopify Checkout",
      "Shop Pay for accelerated checkout",
      "Shopify Payments",
    ],
  },
  {
    title: "Commerce Backend",
    items: [
      "Full catalog via Storefront API",
      "Cart and order management",
      "Multi-currency and multi-language",
      "Analytics and consent management",
    ],
  },
];

export const ShopifyCommerce = () => (
  <div className="grid gap-12 py-12 lg:grid-cols-3 lg:gap-16">
    <div className="flex flex-col gap-4">
      <h2 className="font-sans font-semibold text-2xl tracking-tight text-foreground sm:text-3xl">
        Shopify as the commerce engine
      </h2>
      <p className="text-lg text-muted-foreground">
        Run checkout, payments, and your product catalog on Shopify.
      </p>
    </div>

    {/* Feature columns */}
    {columns.map((column) => (
      <div className="flex flex-col gap-4" key={column.title}>
        <h3 className="font-sans font-semibold text-[20px] text-foreground">
          {column.title}
        </h3>
        <ul className="flex list-disc flex-col gap-3 pl-5 text-muted-foreground marker:text-gray-900">
          {column.items.map((item) => (
            <li className="text-[18px]" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);
