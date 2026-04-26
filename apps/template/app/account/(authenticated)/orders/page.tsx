import { AccountPageHeader } from "@/components/account/page-header";
import { tNamespace } from "@/lib/i18n/server";

export default async function OrdersPage() {
  const labels = await tNamespace("account");

  return (
    <>
      <AccountPageHeader title={labels.orders} description={labels.ordersDescription} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{labels.noOrders}</p>
      </div>
    </>
  );
}
