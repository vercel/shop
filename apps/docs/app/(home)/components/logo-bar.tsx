const brands = [
  "Ruggable",
  "Bombas",
  "PAIGE",
  "AG1",
  "Topps",
  "Supreme",
  "Made In",
];

export const LogoBar = () => (
  <section className="flex flex-col items-center gap-8 px-8 py-12 sm:px-12">
    <div
      className="grid w-full grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-7"
      aria-label="Brands running on Shopify + Vercel + Next.js"
    >
      {brands.map((brand) => (
        <span
          key={brand}
          className="text-center font-semibold text-base text-muted-foreground tracking-tight sm:text-lg"
        >
          {brand}
        </span>
      ))}
    </div>
    <p className="max-w-xl text-balance text-center text-muted-foreground text-sm sm:text-base">
      Brands doing $2B+ in combined GMV already run on Shopify, Vercel, and
      Next.js.
    </p>
  </section>
);
