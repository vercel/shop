import { AccountPageHeader } from "@/components/account/page-header";
import { tNamespace } from "@/lib/i18n/server";

export default async function AddressesPage() {
  const labels = await tNamespace("account");

  return (
    <>
      <AccountPageHeader title={labels.addresses} description={labels.addressesDescription} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{labels.noAddresses}</p>
      </div>
    </>
  );
}
