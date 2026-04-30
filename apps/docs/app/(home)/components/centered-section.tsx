import type { ReactNode } from "react";

interface CenteredSectionProps {
  children: ReactNode;
  description: string;
  title: string;
}

export const CenteredSection = ({
  title,
  description,
  children,
}: CenteredSectionProps) => (
  <div className="grid items-center gap-10 px-4 py-8 sm:px-0 sm:py-12">
    <div className="mx-auto grid max-w-lg gap-4 text-center">
      <h2 className="font-sans font-semibold text-3xl text-gray-1000 leading-10">
        {title}
      </h2>
      <p className="text-balance text-lg text-muted-foreground">
        {description}
      </p>
    </div>

    {children}
  </div>
);
