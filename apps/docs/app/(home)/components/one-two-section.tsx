import type { ReactNode } from "react";

interface OneTwoSectionProps {
  children?: ReactNode;
  description: ReactNode;
  reverse?: boolean;
  title: string;
}

export const OneTwoSection = ({
  title,
  description,
  reverse,
  children,
}: OneTwoSectionProps) => (
  <div className={`grid gap-12 p-8 sm:grid-cols-3 sm:gap-0 sm:p-0 ${reverse ? "" : "sm:divide-x"}`}>
    <div className={`flex flex-col gap-2 text-balance sm:p-12 ${reverse ? "sm:order-last sm:border-l sm:border-fd-border" : ""}`}>
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <div className="mt-2 text-balance text-lg text-muted-foreground">
        {description}
      </div>
    </div>
    <div className="sm:col-span-2 sm:p-12">{children}</div>
  </div>
);
