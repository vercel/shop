"use client";

import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import { ProductFormOptions, ProductFormPrice } from "@/components/product-detail/product-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { shopConfig } from "@/lib/config";
import { loadQuickShopProductAction } from "@/lib/product/action";
import { ProductProvider, useProduct } from "@/lib/product/client";
import type { QuickShopProduct } from "@/lib/product/types";

export function QuickShop({ handle, label }: { handle: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<QuickShopProduct | null>(null);
  const [failed, setFailed] = useState(false);

  async function load() {
    setOpen(true);
    if (product || failed) return;
    try {
      const loaded = await loadQuickShopProductAction(handle);
      if (loaded) setProduct(loaded);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={load}
        className="absolute right-2.5 bottom-2.5 z-10 hidden size-9 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background lg:flex"
      >
        <PlusIcon className="size-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {failed ? (
            <>
              <DialogTitle className="text-xl">{label}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                This product needs its full page. Open it to continue.
              </p>
            </>
          ) : product ? (
            <ProductProvider product={product.form}>
              <div className="grid gap-5">
                <QuickShopHeader fallbackImage={product.image} title={product.title} />
                <ProductFormPrice
                  fallbackVariant={product.form.selectedOrFirstAvailableVariant ?? undefined}
                />
                {product.hasOptions ? <ProductFormOptions handle={handle} /> : null}
                <BuyButtons
                  availableForSale={product.availableForSale}
                  buyWithShop={false}
                  fallbackVariant={product.form.selectedOrFirstAvailableVariant ?? undefined}
                  quantityPicker={shopConfig.pdp.quantityPicker.isEnabled}
                />
              </div>
            </ProductProvider>
          ) : (
            <>
              <DialogTitle className="text-xl">{label}</DialogTitle>
              <div className="flex h-40 items-center justify-center" role="status">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading product options</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Reads the store so the image follows the shopper's colour choice, as the product page does.
function QuickShopHeader({
  fallbackImage,
  title,
}: {
  fallbackImage: string | null;
  title: string;
}) {
  const { selectedVariant } = useProduct();
  const src = selectedVariant?.image?.url ?? fallbackImage;
  return (
    <div className="flex items-start gap-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-accent">
        {src ? (
          <Image src={src} alt={title} fill className="object-cover" sizes="100vw" />
        ) : (
          <ImagePlaceholder className="size-full" />
        )}
      </div>
      <DialogTitle className="text-xl leading-tight">{title}</DialogTitle>
    </div>
  );
}
