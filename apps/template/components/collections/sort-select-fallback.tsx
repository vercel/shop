import { ChevronDownIcon } from "lucide-react";

// Byte-identical Suspense fallback for <CollectionsSortSelect> to avoid hydration shift.
export function SortSelectFallback({ label }: { label: string }) {
  return (
    <div className="flex h-9 w-fit items-center justify-between gap-2 rounded-md bg-transparent px-0 py-2 text-sm whitespace-nowrap">
      <span>{label}</span>
      <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
    </div>
  );
}
