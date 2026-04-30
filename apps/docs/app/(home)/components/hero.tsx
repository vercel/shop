import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  badge: string;
  children: ReactNode;
  description: string;
  title: string;
}

export const Hero = ({ badge, title, description, children }: HeroProps) => (
  <section className="space-y-6 px-4 pt-16 pb-32 text-center sm:pt-24 sm:pb-40">
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Badge className="rounded-full" variant="secondary">
        <div className="size-2 rounded-full bg-gray-700" />
        <p>{badge}</p>
      </Badge>
      <h1 className="font-sans text-balance text-center text-heading-56 sm:text-5xl! xl:text-6xl!">
        {title}
      </h1>
      <p className="mx-auto max-w-3xl text-balance text-muted-foreground leading-relaxed sm:text-xl">
        {description}
      </p>
    </div>
    {children}
  </section>
);
