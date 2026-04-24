import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountPageHeader } from "@/components/account/page-header";
import { requireSession } from "@/lib/auth/server";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
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
