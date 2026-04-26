import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";
import { tNamespace } from "@/lib/i18n/server";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, labels] = await Promise.all([params, tNamespace("account")]);

  if (!id) notFound();

  return (
    <>
      <AccountPageHeader title={`${labels.order} #${id}`} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{labels.orderDetailPlaceholder}</p>
      </div>
    </>
  );
}
