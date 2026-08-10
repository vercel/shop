import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CenteredSectionProps {
  aside?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}

export const CenteredSection = ({ title, description, aside, children }: CenteredSectionProps) => (
  <div className="grid gap-12 py-8 sm:py-12">
    <div className={cn("grid gap-6 sm:items-center sm:gap-10", aside && "md:grid-cols-2")}>
      <div className="grid gap-4">
        <h2 className="text-gray-1000 text-heading-32">{title}</h2>
        <p className="text-balance text-copy-18 text-gray-900">{description}</p>
      </div>
      {aside ? <div className="sm:justify-self-end">{aside}</div> : null}
    </div>
    {children}
  </div>
);
