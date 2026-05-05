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

export const CTA = ({
  title,
  description,
  primary,
  secondary,
  className,
}: CTAProps) => (
  <section
    className={cn(
      "flex flex-col gap-6 border border-gray-alpha-400 px-8 py-10 sm:px-12 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    <div className="flex flex-col gap-0.5">
      <h2 className="font-sans font-semibold text-xl tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-[40px]">
        {title}
      </h2>
      <p className="text-lg text-muted-foreground">{description}</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {secondary ? (
        <Button
          asChild
          className="h-12 w-full sm:w-fit rounded-full px-5"
          variant="secondary"
        >
          <Link href={secondary.href} target={secondary.target}>
            {secondary.label}
          </Link>
        </Button>
      ) : null}
      <Button asChild className="h-12 w-full sm:w-fit rounded-full px-5">
        <Link href={primary.href} target={primary.target}>
          {primary.label}
        </Link>
      </Button>
    </div>
  </section>
);
