import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerProfile } from "@/lib/shopify/operations/customer";

export default function ProfilePage() {
  return (
    <>
      <AccountPageHeader title="Profile" description="Your account information" />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const profile = await getCustomerProfile();
  if (!profile) return null;
  return (
    <ProfileForm
      labels={{
        email: "Email",
        firstName: "First name",
        lastName: "Last name",
        profileUpdated: "Profile updated",
        save: "Save",
      }}
      profile={profile}
    />
  );
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
