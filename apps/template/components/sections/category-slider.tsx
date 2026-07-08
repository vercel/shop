import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";

interface CategorySliderItem {
  href: string;
  image?: string | null;
  label: string;
}

interface CategorySliderProps {
  categories: CategorySliderItem[];
}

export function CategorySlider({ categories }: CategorySliderProps) {
  return (
    <ul
      className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
      data-slot="category-slider"
    >
      {categories.map((category) => (
        <li key={category.href} className="w-[60%] shrink-0 snap-start lg:w-auto">
          <Link
            href={category.href}
            className="group relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-xl"
          >
            {category.image ? (
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 60vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder className="size-full transition-transform duration-300 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-4 left-4 text-2xl sm:text-3xl text-white">
              {category.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
