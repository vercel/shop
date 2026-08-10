import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";

interface CategoryRailItem {
  href: string;
  image?: string | null;
  label: string;
}

interface CategoryRailProps {
  items: CategoryRailItem[];
  title?: string;
}

export function CategoryRail({ items, title }: CategoryRailProps) {
  return (
    <div className="grid gap-4" data-slot="category-rail">
      {title ? <h2 className="text-2xl sm:text-3xl">{title}</h2> : null}
      <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 scroll-px-5 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {items.map((item) => (
          <li key={item.href} className="w-24 shrink-0 snap-start lg:w-auto">
            <Link
              href={item.href}
              prefetch={true}
              className="group grid cursor-pointer justify-items-center gap-2.5"
            >
              <div className="relative aspect-square w-full">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 6rem, 11vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImagePlaceholder className="size-full" />
                )}
              </div>
              <span className="text-center text-sm font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
