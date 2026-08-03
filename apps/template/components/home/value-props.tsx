import { RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type * as React from "react";

import { Container } from "@/components/ui/container";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

const ICONS = {
  returns: RotateCcw,
  shield: ShieldCheck,
  sparkle: Sparkles,
  truck: Truck,
} as const;

interface ValuePropsProps {
  items: { description: string; icon: keyof typeof ICONS; title: string }[];
  tone: ToneId;
}

export function ValueProps({ items, tone }: ValuePropsProps) {
  const t = TONES[tone];

  return (
    <section className={cn("py-10 lg:py-16", t.bg, t.fg)}>
      <Container className="px-5 lg:px-10">
        <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon: React.ComponentType<{ className?: string }> = ICONS[item.icon];
            return (
              <li key={item.title} className="grid content-start gap-2.5">
                <Icon className={cn("size-6", t.subtle)} />
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className={cn("text-sm", t.subtle)}>{item.description}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
