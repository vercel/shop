import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTALink {
  href: string;
  label: string;
  target?: string;
}

interface CTAProps {
  className?: string;
  description: string;
  primary: CTALink;
  secondary?: CTALink;
  title: string;
}

export const CTA = ({ title, description, primary, secondary, className }: CTAProps) => (
  <section
    className={cn("flex flex-col gap-6 md:flex-row md:items-center md:justify-between", className)}
  >
    <div className="flex flex-col gap-0.5">
      <h2 className="text-heading-20 text-foreground sm:text-heading-24 md:text-heading-32 lg:text-heading-40">
        {title}
      </h2>
      <p className="text-copy-18 text-gray-900">{description}</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild className="h-12 w-full md:w-fit rounded-full px-5">
        <Link href={primary.href} target={primary.target}>
          {primary.label}
        </Link>
      </Button>
      {secondary ? (
        <Button asChild className="h-12 w-full md:w-fit rounded-full px-5" variant="secondary">
          <Link href={secondary.href} target={secondary.target}>
            {secondary.label}
          </Link>
        </Button>
      ) : null}
    </div>
  </section>
);
