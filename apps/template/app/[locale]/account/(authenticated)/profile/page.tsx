import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerProfile } from "@/lib/shopify/operations/customer";

export default async function ProfilePage() {
  const t = await getTranslations("account");

  return (
    <>
      <AccountPageHeader title={t("profile")} description={t("profileDescription")} />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const profile = await getCustomerProfile();
  if (!profile) return null;

  return <ProfileForm profile={profile} />;
}

function ProfileSkeleton() {
  return (
    <div className="grid max-w-md gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}
