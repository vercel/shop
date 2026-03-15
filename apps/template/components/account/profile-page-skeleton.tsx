import { Skeleton } from "@/components/ui/skeleton";

function AccountProfileContentSkeleton() {
  return (
    <div className="@container flex flex-col gap-10">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="flex flex-col gap-6 @md:flex-row @md:gap-12">
        <Skeleton className="size-[100px] shrink-0 self-center rounded-full @md:self-start" />

        <div className="flex flex-col gap-6 @md:gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-56 max-w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 @sm:flex-row @sm:gap-6">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl border border-border bg-white px-4 py-4 @sm:px-6 @sm:py-5 @lg:px-8"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-full max-w-[240px]" />
            </div>
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-28" />
        <div className="rounded-xl border border-border bg-white px-8 py-5">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AccountProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>

      <AccountProfileContentSkeleton />
    </div>
  );
}
