"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { useRef, useState } from "react";

import { useLightbox } from "@/components/product-detail/lightbox";
import { virtualTryOnAction } from "@/lib/try-on/action";

const MAX_DIMENSION = 1024;

async function downscaleToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function VirtualTryOn({ productImageUrl }: { productImageUrl: string }) {
  const t = useTranslations("product");
  const open = useLightbox();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(false);
    setLoading(true);
    try {
      const personImage = await downscaleToDataUrl(file);
      const result = await virtualTryOnAction({ personImage, productImageUrl });
      if (!result.success) {
        setError(true);
        return;
      }
      open?.({
        type: "image",
        image: {
          altText: t("virtualTryOnResultAlt"),
          height: MAX_DIMENSION,
          url: result.image,
          width: MAX_DIMENSION,
        },
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const label = error
    ? t("virtualTryOnError")
    : loading
      ? t("virtualTryOnGenerating")
      : t("virtualTryOn");

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
        aria-label={t("virtualTryOnUploadLabel")}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        data-error={error || undefined}
        className="absolute bottom-4 right-4 z-10 cursor-pointer rounded-lg border border-border bg-white px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50 data-[error]:text-destructive"
      >
        {label}
      </button>
    </>
  );
}
