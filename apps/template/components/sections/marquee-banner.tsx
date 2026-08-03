interface MarqueeBannerProps {
  items: string[];
}

export function MarqueeBanner({ items }: MarqueeBannerProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label={items.join(", ")}
      className="flex overflow-hidden border-y border-border bg-accent py-4"
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
            <li
              key={item}
              className="whitespace-nowrap text-sm font-medium uppercase tracking-widest text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
