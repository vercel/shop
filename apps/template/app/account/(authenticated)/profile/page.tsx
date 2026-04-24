import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccountPageHeader } from "@/components/account/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerSession } from "@/lib/auth/server";

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
  const [session, t] = await Promise.all([
    getCustomerSession(),
    getTranslations("account"),
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("name")}</dt>
            <dd className="font-medium">
              {[session?.firstName, session?.lastName].filter(Boolean).join(" ") || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("email")}</dt>
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
