import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { isAuthEnabled } from "@/lib/auth";
import { requireCustomerSession } from "@/lib/auth/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  return {
    title: t("accountTitle"),
    robots: { index: false, follow: false },
  };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account" />}>
      <AccountGate>{children}</AccountGate>
    </Suspense>
  );
}

async function AccountGate({ children }: { children: React.ReactNode }) {
  if (!isAuthEnabled) notFound();
  await requireCustomerSession();
  return <div data-storefront-canvas="account">{children}</div>;
}
