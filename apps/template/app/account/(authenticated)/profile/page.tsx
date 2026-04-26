import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerSession } from "@/lib/auth/server";
import { tNamespace } from "@/lib/i18n/server";

export default async function ProfilePage() {
  const labels = await tNamespace("account");

  return (
    <>
      <AccountPageHeader title={labels.profile} description={labels.profileDescription} />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const [session, labels] = await Promise.all([getCustomerSession(), tNamespace("account")]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{labels.name}</dt>
            <dd className="font-medium">
              {[session?.firstName, session?.lastName].filter(Boolean).join(" ") || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{labels.email}</dt>
            <dd className="font-medium">{session?.email || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}
