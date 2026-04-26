import Link from "next/link";

import { tNamespace } from "@/lib/i18n/server";

export async function Empty() {
  const labels = await tNamespace("cart");

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 px-5">
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{labels.empty}</h2>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        {labels.continueShopping}
      </Link>
    </div>
  );
}
