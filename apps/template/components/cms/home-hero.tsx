import { HeroSection } from "@/components/cms/hero-section";
import { Skeleton } from "@/components/ui/skeleton";
import type { Homepage } from "@/lib/types";

export async function HomeHero({
  pagePromise,
}: {
  pagePromise: Promise<Homepage | null>;
}) {
  const page = await pagePromise;

  if (!page) return null;

  return page.heroSection ? <HeroSection hero={page.heroSection} /> : null;
}

export function HomeHeroSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-xl" />;
}
