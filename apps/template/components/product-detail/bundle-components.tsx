import type { ProductVariant } from "@/lib/types";

// TEMP scaffold for slice B: dumps the selected variant's bundle relationships
// so we can inspect the live shape before building real UI. Replace with the
// fixed-bundle contents + "part of these bundles" components.
export function BundleComponents({ variant }: { variant: ProductVariant }) {
  return (
    <pre
      data-slot="bundle-debug"
      className="overflow-auto rounded-md border border-border bg-muted p-4 text-xs leading-relaxed"
    >
      {JSON.stringify(
        {
          variantId: variant.id,
          variantTitle: variant.title,
          requiresComponents: variant.requiresComponents,
          components: variant.components,
          bundleParents: variant.bundleParents,
        },
        null,
        2,
      )}
    </pre>
  );
}
