import Image from "next/image";

import type { ContentSection } from "@/lib/types";

interface ImageGallerySectionProps {
  section: ContentSection;
}

export function ImageGallerySection({ section }: ImageGallerySectionProps) {
  const { title, media, settings } = section;
  const columns = typeof settings?.columns === "number" ? settings.columns : 3;

  if (media.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {title && (
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">{title}</h2>
        )}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(columns, media.length)}, minmax(0, 1fr))`,
          }}
        >
          {media.map((image) => (
            <div
              key={image.url}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes={`(max-width: 640px) 100vw, (max-width: 1024px) ${100 / Math.min(2, columns)}vw, ${100 / columns}vw`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
