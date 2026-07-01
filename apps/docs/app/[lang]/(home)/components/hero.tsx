import type { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
  description: string;
  title: string;
}

export const Hero = ({ title, description, children }: HeroProps) => (
  <section className="space-y-6 pt-16 pb-32 text-center sm:pt-24 sm:pb-40">
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <h1 className="font-sans text-balance text-center text-heading-40 sm:text-heading-48 lg:text-heading-56">
        {title}
      </h1>
      <p className="mx-auto max-w-3xl text-balance text-muted-foreground leading-relaxed sm:text-xl">
        {description}
      </p>
    </div>
    {children}
  </section>
);
