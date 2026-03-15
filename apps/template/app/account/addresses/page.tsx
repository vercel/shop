import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@/components/account/page-header";
import { requireSession } from "@/lib/auth/server";
import { getAddresses } from "@/lib/shopify/operations/customer";
import { AddressesClient } from "./addresses-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("addressBook") };
}

export default async function AddressesPage() {
  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader
        breadcrumbs={[{ label: t("settings") }, { label: t("addressBook") }]}
        title={t("addressBook")}
      />

      <Suspense fallback={<AddressesLoading />}>
        <AddressesContent />
      </Suspense>
    </div>
  );
}

async function AddressesContent() {
  const session = await requireSession();
  const addresses = await getAddresses(session.accessToken);

  return <AddressesClient addresses={addresses} />;
}

function AddressesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="h-10 w-28 animate-pulse bg-gray-100 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-6 p-4 bg-muted rounded-xl border border-ring"
          >
            <div className="flex flex-col gap-3 opacity-80">
              <div className="flex flex-row gap-1 pb-2 justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-12 animate-pulse bg-gray-200 rounded" />
                  <div className="h-5 w-32 animate-pulse bg-gray-200 rounded" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-3 w-12 animate-pulse bg-gray-200 rounded" />
                <div className="h-4 w-48 animate-pulse bg-gray-200 rounded" />
                <div className="h-4 w-40 animate-pulse bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex flex-row gap-3">
              <div className="h-4 w-16 animate-pulse bg-gray-200 rounded" />
              <div className="h-4 w-14 animate-pulse bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
