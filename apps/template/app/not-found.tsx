import Link from "next/link";

import { Container } from "@/components/ui/container";
import { tNamespace } from "@/lib/i18n/server";

export default async function NotFoundError() {
  const labels = await tNamespace("common");

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-10 text-center lg:py-10">
      <div className="flex flex-col items-center text-center gap-2.5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          {labels.notFound}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl">{labels.notFoundDesc}</p>
        <Link
          href="/search"
          className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          {labels.continueShopping}
        </Link>
      </div>
    </Container>
  );
}
