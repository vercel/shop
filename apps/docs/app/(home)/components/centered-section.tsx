import type { ReactNode } from "react";

interface CenteredSectionProps {
  aside?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}

export const CenteredSection = ({
  title,
  description,
  aside,
  children,
}: CenteredSectionProps) => (
  <div className="grid gap-12 py-8 sm:py-12">
    <div className="grid gap-6 md:grid-cols-2 sm:items-center sm:gap-10">
      <div className="grid gap-4">
        <h2 className="font-sans font-semibold text-3xl text-gray-1000 leading-10 tracking-[-0.04em]">
          {title}
        </h2>
        <p className="text-balance text-lg text-muted-foreground">
          {description}
        </p>
      </div>
      {aside ? <div className="sm:justify-self-center">{aside}</div> : null}
    </div>
    {children}
  </div>
);
