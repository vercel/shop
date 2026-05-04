import type { ReactNode } from "react";

interface OneTwoSectionProps {
  children?: ReactNode;
  description: ReactNode;
  leftClassName?: string;
  title: string;
}

export const OneTwoSection = ({
  title,
  description,
  leftClassName,
  children,
}: OneTwoSectionProps) => (
  <div className="grid gap-12 py-8 xl:grid-cols-[436px_572px] xl:gap-x-[72px] xl:gap-y-0 xl:p-0 xl:py-12">
    <div
      className={`flex flex-col gap-2 text-balance${leftClassName ? ` ${leftClassName}` : ""}`}
    >
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <div className="mt-2 text-balance text-lg text-muted-foreground">
        {description}
      </div>
    </div>
    <div>{children}</div>
  </div>
);
