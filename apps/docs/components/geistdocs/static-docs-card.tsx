import { Card, type CardProps } from "fumadocs-ui/components/card";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const StaticDocsCard = ({ external, href, ...props }: CardProps) => {
  if (!(href?.startsWith("/docs") && !external)) {
    return <Card external={external} href={href} {...props} />;
  }

  return (
    <Link
      className="group block rounded-xl no-underline outline-none @max-lg:col-span-full focus-visible:shadow-[var(--ds-focus-ring)]"
      data-card
      href={href}
      prefetch={true}
    >
      <Card {...props} className={cn("h-full group-hover:bg-fd-accent/80", props.className)} />
    </Link>
  );
};
