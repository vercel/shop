import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("account");

  if (!id) notFound();

  return (
    <>
      <AccountPageHeader title={`${t("order")} #${id}`} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("orderDetailPlaceholder")}</p>
      </div>
    </>
  );
}
