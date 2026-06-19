import { Suspense } from "react";

import { getCustomerProfile } from "@/lib/shopify/operations/customer";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account-profile" />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const profile = await getCustomerProfile();
  return <div data-profile-available={Boolean(profile)} data-storefront-canvas="account-profile" />;
}
