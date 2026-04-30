import type { ReactNode } from "react";

interface OneTwoSectionProps {
  children?: ReactNode;
  description: ReactNode;
  title: string;
}

export const OneTwoSection = ({
  title,
  description,
  children,
}: OneTwoSectionProps) => (
  <div className="grid gap-12 p-8 sm:grid-cols-3 sm:gap-0 sm:p-0 sm:py-12">
    <div className="flex flex-col gap-2 text-balance">
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <div className="mt-2 text-balance text-lg text-muted-foreground">
        {description}
      </div>
    </div>
    <div className="sm:col-span-2">{children}</div>
  </div>
);
