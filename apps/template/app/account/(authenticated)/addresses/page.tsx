import { Suspense } from "react";

import { getCustomerAddresses } from "@/lib/shopify/operations/customer";

export default function AddressesPage() {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account-addresses" />}>
      <AddressesContent />
    </Suspense>
  );
}

async function AddressesContent() {
  const addresses = await getCustomerAddresses();
  return <div data-address-count={addresses.length} data-storefront-canvas="account-addresses" />;
}
