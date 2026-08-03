import { Leaf, RotateCcw, Sparkles, Truck } from "lucide-react";

interface ValuePropsItem {
  body: string;
  icon: "leaf" | "returns" | "shipping" | "support";
  title: string;
}

interface ValuePropsProps {
  items: ValuePropsItem[];
}

const ICONS = {
  leaf: Leaf,
  returns: RotateCcw,
  shipping: Truck,
  support: Sparkles,
} as const;

export function ValueProps({ items }: ValuePropsProps) {
  return (
    <ul
      className="grid grid-cols-2 gap-5 border-y border-border py-5 lg:grid-cols-4 lg:gap-10"
      data-slot="value-props"
    >
      {items.map((item) => {
        const Icon = ICONS[item.icon];

        return (
          <li key={item.title} className="flex items-start gap-2.5">
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="grid gap-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
