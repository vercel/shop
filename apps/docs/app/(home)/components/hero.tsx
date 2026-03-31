import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  badge: string;
  children: ReactNode;
  description: string;
  title: string;
}

export const Hero = ({ badge, title, description, children }: HeroProps) => (
  <section className="mt-(--fd-nav-height) space-y-6 px-4 pt-16 pb-16 text-center sm:pt-24">
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Badge className="rounded-full" variant="secondary">
        <div className="size-2 rounded-full bg-muted-foreground" />
        <p>{badge}</p>
      </Badge>
      <h1 className="font-pixel-triangle text-balance text-center font-normal text-[40px]! leading-[1.1] tracking-tight dark:text-white sm:text-5xl! xl:text-6xl!">
        {title}
      </h1>
      <p className="mx-auto max-w-3xl font-sans text-balance text-muted-foreground leading-relaxed sm:text-xl">
        {description}
      </p>
    </div>
    {children}
  </section>
);
