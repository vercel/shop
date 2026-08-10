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
  <div className="grid gap-12 py-8 md:grid-cols-2 xl:gap-y-0 xl:p-0 xl:py-12">
    <div
      className={`flex flex-col gap-2 text-balance${leftClassName ? ` ${leftClassName}` : ""}`}
    >
      <h2 className="text-heading-20 dark:text-white sm:text-heading-24 md:text-heading-32">
        {title}
      </h2>
      <div className="mt-2 text-balance lg:max-w-lg text-copy-18 text-gray-900">
        {description}
      </div>
    </div>
    <div>{children}</div>
  </div>
);
