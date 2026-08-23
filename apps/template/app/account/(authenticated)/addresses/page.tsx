import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AddressBook } from "@/components/account/address-book";
import { AccountPageHeader } from "@/components/account/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerAddresses } from "@/lib/shopify/operations/customer";

export default async function AddressesPage() {
  const t = await getTranslations("account");

  return (
    <>
      <AccountPageHeader title={t("addresses")} description={t("addressesDescription")} />
      <Suspense fallback={<AddressesSkeleton />}>
        <AddressesContent />
      </Suspense>
    </>
  );
}

async function AddressesContent() {
  const [addresses, messages] = await Promise.all([getCustomerAddresses(), getMessages()]);
  return (
    <NextIntlClientProvider messages={{ account: messages.account }}>
      <AddressBook addresses={addresses} />
    </NextIntlClientProvider>
  );
}

function AddressesSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-9 w-32 rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}
