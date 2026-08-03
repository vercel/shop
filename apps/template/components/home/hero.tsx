import Link from "next/link";

import { MerchSlot } from "@/components/ui/merch-slot";

export function HomeHero() {
  return (
    <section className="bg-layer-1 text-layer-1-foreground">
      <div className="mx-auto grid max-w-384 gap-5 px-5 py-10 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-20">
        <div className="flex flex-col items-start gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-layer-1-subtle">
            New Season · Fall/Winter &apos;26
          </p>
          <div className="grid gap-2.5">
            <h1 className="max-w-xl text-4xl sm:text-5xl lg:text-6xl">
              Built in Layers. Worn Everywhere.
            </h1>
            <p className="max-w-xl text-sm text-layer-1-subtle md:text-base">
              Premium essentials for every body and every season — heavyweight hoodies, crisp tees,
              and outerwear that outlasts the weather.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/collections/all"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-background/85"
            >
              Shop All
            </Link>
            <Link
              href="/collections/frontpage"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-layer-1-foreground/30 px-8 text-sm font-medium transition-colors hover:border-layer-1-foreground/70"
            >
              New Arrivals
            </Link>
          </div>
        </div>
        <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-layer-10">
          <MerchSlot label="Hero image" />
        </div>
      </div>
    </section>
  );
}
