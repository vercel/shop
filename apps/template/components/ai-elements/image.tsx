import type { Experimental_GeneratedImage } from "ai";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  alt = "",
  className,
  ...props
}: ImageProps) => {
  if (!base64) {
    return null;
  }

  return (
    <NextImage
      {...props}
      alt={alt}
      className={cn("h-auto max-w-full overflow-hidden rounded-md", className)}
      src={`data:${mediaType};base64,${base64}`}
      unoptimized
    />
  );
};
