interface MarqueeBannerProps {
  items: string[];
}

export function MarqueeBanner({ items }: MarqueeBannerProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label={items.join(", ")}
      className="flex overflow-hidden py-2"
      data-slot="marquee-banner"
    >
      {/* Two identical tracks each shift a full width, so the second slides into the first's place seamlessly. */}
      {[0, 1].map((track) => (
        <ul
          key={track}
          aria-hidden={track === 1}
          className="flex shrink-0 animate-marquee items-center gap-10 pr-10"
        >
          {items.map((item) => (
            <li key={item} className="whitespace-nowrap text-2xl tracking-tight sm:text-3xl">
              {item}
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
