import Image from "next/image";

import type { Image as ImageType, Video } from "@/lib/types";

import { AutoPlayVideo } from "./auto-play-video";

type MediaItem = { type: "video"; video: Video } | { type: "image"; image: ImageType };

export function ImageGrid({
  images,
  videos,
  title,
}: {
  images: ImageType[];
  videos: Video[];
  title: string;
}) {
  const mediaItems: MediaItem[] = [
    ...images.map((image): MediaItem => ({ type: "image", image })),
    ...videos.map((video): MediaItem => ({ type: "video", video })),
  ];

  if (mediaItems.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {mediaItems.map((item, idx) => {
        const key = item.type === "video" ? item.video.url : item.image.url;
        return (
          <div
            key={key}
            className="relative aspect-square w-full overflow-hidden rounded-xl bg-accent"
          >
            {item.type === "video" ? (
              <AutoPlayVideo
                src={item.video.url}
                poster={item.video.previewImage?.url}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <Image
                src={item.image.url}
                alt={item.image.altText || `${title} image ${idx + 1}`}
                fill
                className="object-cover rounded-xl"
                sizes="(min-width: 1024px) 25vw, 50vw"
                priority={idx < 2}
                loading={idx < 2 ? "eager" : "lazy"}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
