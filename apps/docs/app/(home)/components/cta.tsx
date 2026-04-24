import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface CTAAction {
  label: string;
  href: string;
  description?: string;
  variant?: "default" | "outline" | "ghost";
  external?: boolean;
}

interface CTAProps {
  actions: CTAAction[];
  description?: string;
  title: string;
}

export const CTA = ({ title, description, actions }: CTAProps) => (
  <section className="flex flex-col gap-8 px-8 py-12 sm:px-12 sm:py-16">
    <div className="grid max-w-2xl gap-3">
      <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl lg:text-[40px]">
        {title}
      </h2>
      {description ? (
        <p className="text-balance text-lg text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action, index) => (
        <div
          key={action.label}
          className="flex flex-col gap-3 rounded-lg border bg-background p-6"
        >
          {action.description ? (
            <p className="text-muted-foreground text-sm">{action.description}</p>
          ) : null}
          <Button
            asChild
            size="lg"
            variant={action.variant ?? (index === 0 ? "default" : "outline")}
          >
            {action.external ? (
              <a
                href={action.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {action.label}
              </a>
            ) : (
              <Link href={action.href}>{action.label}</Link>
            )}
          </Button>
        </div>
      ))}
    </div>
  </section>
);
