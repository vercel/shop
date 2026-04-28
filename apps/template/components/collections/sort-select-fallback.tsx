import { ChevronDownIcon } from "lucide-react";

// Server-rendered lookalike of the live <CollectionsSortSelect> trigger.
// Used as a Suspense fallback so the toolbar row height (h-9) and the
// trigger's text + chevron are byte-identical pre/post hydration.
export function SortSelectFallback({ label }: { label: string }) {
  return (
    <div className="flex h-9 w-fit items-center justify-between gap-2 rounded-md bg-transparent px-0 py-2 text-sm whitespace-nowrap">
      <span>{label}</span>
      <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
    </div>
  );
}
