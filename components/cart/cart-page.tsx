"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuspenseCart } from "@/lib/cart/client";

import { CartLineItem } from "./line-item";
import { CartSummary } from "./summary";
import { CartWarnings } from "./warnings";

export function CartPageContent() {
  const cart = useSuspenseCart((state) => state.data);

  if (cart.totalQuantity === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-10 px-5">
        <h2 className="text-2xl sm:text-3xl">Your cart is empty</h2>
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <CartPageLayout
      count={
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {cart.totalQuantity}
        </span>
      }
      summary={<CartSummary cart={cart} />}
      warnings={<CartWarnings />}
    >
      <ul className="grid gap-5" aria-label="Cart items">
        {cart.lines.nodes.map((item) => (
          <CartLineItem key={item.id} item={item} />
        ))}
      </ul>
    </CartPageLayout>
  );
}

export function CartPageSkeleton() {
  return (
    <CartPageLayout
      aria-busy="true"
      count={<Skeleton className="size-7 rounded-full" />}
      summary={
        <div className="grid gap-5">
          <div className="grid gap-2.5">
            <div className="flex gap-2.5">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-18 rounded-lg" />
            </div>
            <div className="grid gap-1">
              <div className="flex h-7 items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-12 rounded-lg" />
        </div>
      }
    >
      <ul className="grid gap-5">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex gap-2.5">
            <Skeleton className="size-18 shrink-0 rounded-none" />
            <div className="grid min-h-18 flex-1 gap-2.5 pt-0.5">
              <div className="grid gap-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 self-end rounded-full" />
            </div>
            <Skeleton className="h-5 w-16" />
          </li>
        ))}
      </ul>
    </CartPageLayout>
  );
}

interface CartPageLayoutProps extends ComponentProps<"div"> {
  count: ReactNode;
  summary: ReactNode;
  warnings?: ReactNode;
}

function CartPageLayout({ children, count, summary, warnings, ...props }: CartPageLayoutProps) {
  return (
    <Page {...props}>
      <Container>
        <Sections>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl">Cart</h1>
            {count}
          </div>
          {warnings}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 xl:col-span-9">{children}</div>
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="lg:sticky lg:top-20">{summary}</div>
            </aside>
          </div>
        </Sections>
      </Container>
    </Page>
  );
}
