import type { Metafield } from "@/lib/types";

interface ProductSpecsProps {
  metafields: Metafield[];
  title: string;
}

export function ProductSpecs({ metafields, title }: ProductSpecsProps) {
  if (metafields.length === 0) return null;
  return (
    <div className="grid gap-2.5" data-slot="product-specs">
      <h2 className="font-medium text-foreground/70 text-sm">{title}</h2>
      <dl className="grid gap-2.5">
        {metafields.map((metafield) => (
          <div key={metafield.key} className="flex items-baseline justify-between gap-4">
            <dt className="text-foreground/50 text-sm">{metafield.label}</dt>
            <dd className="text-right font-medium text-sm">{metafield.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
