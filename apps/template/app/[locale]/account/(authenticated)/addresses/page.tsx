import { getTranslations } from "next-intl/server";

import { AccountPageHeader } from "@/components/account/page-header";

export default async function AddressesPage() {
  const t = await getTranslations("account");

  return (
    <>
      <AccountPageHeader title={t("addresses")} description={t("addressesDescription")} />
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
      </div>
    </>
  );
}
