import Image from "next/image";
import Link from "next/link";

interface CollectionCard {
  id: string;
  title: string;
  href: string;
  image: { url: string; alt: string };
}

export function CollectionCards({ cards }: { cards: CollectionCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className="group relative block aspect-[3/4] overflow-hidden rounded-lg"
        >
          <Image
            src={card.image.url}
            alt={card.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
          <h3 className="absolute bottom-5 left-5 right-5 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {card.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
