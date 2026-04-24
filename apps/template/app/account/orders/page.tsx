import { getTranslations } from "next-intl/server";

import { AccountPageHeader } from "@/components/account/page-header";

export default async function OrdersPage() {
  const t = await getTranslations("account");

  return (
    <>
      <AccountPageHeader title={t("orders")} description={t("ordersDescription")} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
      </div>
    </>
  );
}
