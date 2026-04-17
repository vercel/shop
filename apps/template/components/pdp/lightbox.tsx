"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import type { Image as ImageType, Video } from "@/lib/types";

import { AutoPlayVideo } from "./auto-play-video";

type MediaItem = { type: "video"; video: Video } | { type: "image"; image: ImageType };

const LightboxContext = createContext<((item: MediaItem) => void) | null>(null);

export function Lightbox({ label, children }: { label: string; children: ReactNode }) {
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const close = useCallback(() => setActiveItem(null), []);

  return (
    <LightboxContext.Provider value={setActiveItem}>
      {children}

      <DialogPrimitive.Root open={activeItem !== null} onOpenChange={(open) => !open && close()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-60 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-60 flex items-center justify-center p-8 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            aria-label={`${label} enlarged`}
          >
            <DialogPrimitive.Close className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80 focus:ring-2 focus:ring-white focus:outline-hidden">
              <XIcon className="size-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {activeItem?.type === "image" && (
              <div className="relative h-full w-full">
                <Image
                  src={activeItem.image.url}
                  alt={activeItem.image.altText || `${label} enlarged`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              </div>
            )}

            {activeItem?.type === "video" && activeItem.video.previewImage && (
              <div className="relative h-full w-full">
                <Image
                  src={activeItem.video.previewImage.url}
                  alt={activeItem.video.previewImage.altText || `${label} video enlarged`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              </div>
            )}

            {activeItem?.type === "video" && !activeItem.video.previewImage && (
              <AutoPlayVideo
                src={activeItem.video.url}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </LightboxContext.Provider>
  );
}

export function LightboxTrigger({ item, children }: { item: MediaItem; children: ReactNode }) {
  const open = useContext(LightboxContext);
  return (
    <button type="button" onClick={() => open?.(item)} className="h-full w-full cursor-zoom-in">
      {children}
    </button>
  );
}
