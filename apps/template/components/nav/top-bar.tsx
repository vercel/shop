import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";

export async function TopBar() {
  const t = await getTranslations("nav");

  return (
    <div className="h-8 bg-link text-link-foreground">
      <Container className="flex h-full items-center text-xs">
        <span>
          {t("shippingTo")}{" "}
          <Suspense>
            <PostalCode />
          </Suspense>
        </span>
      </Container>
    </div>
  );
}

async function PostalCode() {
  const h = await headers();
  return h.get("x-vercel-ip-postal-code") ?? "—";
}
