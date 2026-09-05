import { Suspense } from "react";

import { AddressBook } from "@/components/account/address-book";
import { AccountPageHeader } from "@/components/account/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerAddresses } from "@/lib/shopify/operations/customer";

export default function AddressesPage() {
  return (
    <>
      <AccountPageHeader title="Addresses" description="Manage your saved addresses" />
      <Suspense fallback={<AddressesSkeleton />}>
        <AddressesContent />
      </Suspense>
    </>
  );
}

async function AddressesContent() {
  const addresses = await getCustomerAddresses();
  return <AddressBook addresses={addresses} />;
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
