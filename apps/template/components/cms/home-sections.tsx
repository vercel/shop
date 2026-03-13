import { MarketingPageRenderer } from "@/components/cms/page-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import type { Homepage } from "@/lib/types";

export async function HomeSections({
  pagePromise,
}: {
  pagePromise: Promise<Homepage | null>;
}) {
  const page = await pagePromise;

  if (!page || page.sections.length === 0) return null;

  return <MarketingPageRenderer page={{ ...page, heroSection: null }} />;
}

export function HomeSectionsSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-16 pt-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
