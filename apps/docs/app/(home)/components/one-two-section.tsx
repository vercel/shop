import type { ReactNode } from "react";

interface OneTwoSectionProps {
  children?: ReactNode;
  description: string;
  reverse?: boolean;
  title: string;
}

export const OneTwoSection = ({
  title,
  description,
  reverse,
  children,
}: OneTwoSectionProps) => (
  <div className="grid gap-12 p-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:p-0">
    <div className={`flex flex-col gap-2 text-balance sm:p-12 ${reverse ? "sm:order-last" : ""}`}>
      <h2 className="font-pixel-square font-normal text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-balance text-lg text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="sm:col-span-2 sm:p-12">{children}</div>
  </div>
);
