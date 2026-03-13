import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountClient } from "@/components/account/client";
import { AccountPageHeader } from "@/components/account/page-header";
import { AccountProfilePageSkeleton } from "@/components/account/profile-page-skeleton";
import { requireCustomerSession } from "@/lib/auth/server";
import { getLocale } from "@/lib/params";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("profile") };
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<AccountProfilePageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const [t, locale, session] = await Promise.all([
    getTranslations("account"),
    getLocale(),
    requireCustomerSession(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader
        breadcrumbs={[{ label: t("settings") }, { label: t("profile") }]}
        title={t("profile")}
      />

      <AccountClient
        customer={{
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
        }}
        currentLocale={locale}
      />
    </div>
  );
}
