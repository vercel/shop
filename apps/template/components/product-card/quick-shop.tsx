"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import { ProductFormOptions, ProductFormPrice } from "@/components/product-detail/product-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { shopConfig } from "@/lib/config";
import { buildProductUrl } from "@/lib/product";
import { loadQuickShopProductAction } from "@/lib/product/action";
import { ProductProvider, useProduct } from "@/lib/product/client";
import type { QuickShopProduct } from "@/lib/product/types";

type QuickShopStatus = "failed" | "idle" | "loading" | "unavailable";

interface QuickShopProps {
  handle: string;
  href: string;
  image: string | null;
  label: string;
  title: string;
}

export function QuickShop({ handle, href, image, label, title }: QuickShopProps) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<QuickShopProduct | null>(null);
  const [status, setStatus] = useState<QuickShopStatus>("idle");
  const [cartHandoff, setCartHandoff] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  async function load() {
    if (product || status === "loading") return;
    setStatus("loading");
    try {
      const loaded = await loadQuickShopProductAction(handle);
      setProduct(loaded);
      setStatus(loaded ? "idle" : "unavailable");
    } catch {
      setStatus("failed");
    }
  }

  function closeForCart() {
    setCartHandoff(true);
    setOpen(false);
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (nextOpen) setCartHandoff(false);
        setOpen(nextOpen);
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <button
            aria-label={`${label}: ${title}`}
            className="absolute right-2.5 bottom-2.5 z-10 hidden size-9 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background lg:flex"
            onClick={load}
            type="button"
          >
            <PlusIcon className="size-4" />
          </button>
        }
      />
      {/* Hidden overflow is programmatically scrollable, which can displace the close button. */}
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[calc(100dvh-2.5rem)] w-[calc(100%-2.5rem)] max-w-3xl flex-col gap-0 overflow-clip p-0 sm:max-w-[min(48rem,calc(200dvh-5rem-2px))]"
        finalFocus={cartHandoff ? false : undefined}
        initialFocus={closeButtonRef}
        showCloseButton={false}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain sm:overflow-visible">
          {product ? (
            <ProductProvider product={product.form}>
              <QuickShopDetails
                handle={handle}
                onAddToCart={closeForCart}
                onNavigate={() => setOpen(false)}
                product={product}
              />
            </ProductProvider>
          ) : (
            <QuickShopLayout
              image={image}
              price={
                status === "failed" || status === "unavailable" ? null : (
                  <Skeleton className="h-7 w-24" />
                )
              }
              title={title}
            >
              {status === "failed" || status === "unavailable" ? (
                <div className="grid gap-4">
                  <p className="text-sm text-muted-foreground" role="status">
                    {status === "failed"
                      ? "We couldn’t load the purchase options. Try again or open the product page."
                      : "Quick shop is unavailable for this product."}
                  </p>
                  {status === "failed" ? (
                    <Button className="h-12 w-full" onClick={load} type="button" variant="outline">
                      Try again
                    </Button>
                  ) : null}
                </div>
              ) : (
                <QuickShopSkeleton />
              )}
              <QuickShopDetailsLink href={href} onNavigate={() => setOpen(false)} />
            </QuickShopLayout>
          )}
        </div>
        <DialogPrimitive.Close
          aria-label="Close quick shop"
          className="absolute top-6.5 right-5 z-10 flex size-5 cursor-pointer items-center justify-center text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2"
          ref={closeButtonRef}
        >
          <XIcon className="size-5" />
        </DialogPrimitive.Close>
      </DialogContent>
    </Dialog>
  );
}

interface QuickShopDetailsProps {
  handle: string;
  onAddToCart: () => void;
  onNavigate: () => void;
  product: QuickShopProduct;
}

function QuickShopDetails({ handle, onAddToCart, onNavigate, product }: QuickShopDetailsProps) {
  const { options, selectedVariant } = useProduct();
  const fallbackVariant = product.form.selectedOrFirstAvailableVariant ?? undefined;
  const selectedOptions = options.flatMap((option) =>
    option.values
      .filter((value) => value.selected)
      .map((value) => ({ name: option.name, value: value.name })),
  );
  const href = buildProductUrl(selectedVariant?.product.handle ?? handle, selectedOptions);

  return (
    <QuickShopLayout
      image={selectedVariant?.image?.url ?? product.image}
      price={<ProductFormPrice fallbackVariant={fallbackVariant} />}
      title={product.title}
    >
      {product.hasOptions ? <ProductFormOptions handle={handle} /> : null}
      <BuyButtons
        availableForSale={product.availableForSale}
        buyWithShop={shopConfig.pdp.buyWithShop.isEnabled}
        fallbackVariant={fallbackVariant}
        onAddToCart={onAddToCart}
        quantityPicker={shopConfig.pdp.quantityPicker.isEnabled}
      />
      <QuickShopDetailsLink href={href} onNavigate={onNavigate} />
    </QuickShopLayout>
  );
}

interface QuickShopLayoutProps {
  children: ReactNode;
  image: string | null;
  price: ReactNode;
  title: string;
}

function QuickShopLayout({ children, image, price, title }: QuickShopLayoutProps) {
  return (
    <div className="grid min-h-0 sm:aspect-[2/1] sm:grid-cols-2 sm:grid-rows-[auto_minmax(0,1fr)]">
      <div className="relative aspect-square overflow-hidden bg-accent sm:row-span-2">
        {image ? (
          <Image alt={title} className="object-cover" fill sizes="100vw" src={image} />
        ) : (
          <ImagePlaceholder className="size-full" />
        )}
      </div>
      <div className="sticky top-0 z-10 order-first grid min-w-0 grid-cols-[minmax(0,1fr)_1.25rem] gap-2.5 bg-background p-5 pb-2.5 sm:static sm:order-none">
        <div className="min-w-0">
          <DialogTitle className="text-2xl leading-snug font-normal break-words">
            {title}
          </DialogTitle>
          {price}
        </div>
      </div>
      <div className="grid min-h-0 min-w-0 content-start gap-4 px-5 pb-5 sm:overflow-y-auto sm:overscroll-contain">
        {children}
      </div>
    </div>
  );
}

interface QuickShopDetailsLinkProps {
  href: string;
  onNavigate: () => void;
}

function QuickShopDetailsLink({ href, onNavigate }: QuickShopDetailsLinkProps) {
  return (
    <Link
      className="w-fit cursor-pointer text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      href={href}
      onNavigate={onNavigate}
    >
      View full details
    </Link>
  );
}

function QuickShopSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-5" role="status">
      <span className="sr-only">Loading purchase options</span>
      <div aria-hidden="true" className="grid gap-5">
        <Skeleton className="h-5 w-24" />
        <div className="grid gap-2.5">
          <Skeleton className="h-5 w-12" />
          <div className="flex flex-wrap gap-2.5">
            {[0, 1, 2, 3, 4].map((value) => (
              <Skeleton className="h-9.5 w-15 rounded-lg" key={value} />
            ))}
          </div>
        </div>
        <div className="grid gap-2.5">
          <div className="flex flex-wrap gap-2.5">
            {shopConfig.pdp.quantityPicker.isEnabled ? (
              <Skeleton className="h-12 w-32 shrink-0" />
            ) : null}
            <Skeleton className="h-12 min-w-40 flex-1" />
          </div>
          {shopConfig.pdp.buyWithShop.isEnabled ? <Skeleton className="h-12 w-full" /> : null}
        </div>
      </div>
    </div>
  );
}
