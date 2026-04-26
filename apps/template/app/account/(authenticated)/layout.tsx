import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccountMobileTabs } from "@/components/account/mobile-tabs";
import { AccountSidebar } from "@/components/account/sidebar";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthEnabled } from "@/lib/auth";
import { requireCustomerSession } from "@/lib/auth/server";
import { t } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await t("seo.accountTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthEnabled) notFound();
  const signOutLabel = await t("account.signOut");

  return (
    <Container className="py-10 flex flex-1 flex-col gap-6 md:flex-row md:gap-10">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-24 flex flex-col gap-6">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo />
          </Suspense>
          <Suspense fallback={<SidebarSkeleton />}>
            <AccountSidebar />
          </Suspense>
          <SignOutButton signOutLabel={signOutLabel} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between md:hidden">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo />
          </Suspense>
          <SignOutButton signOutLabel={signOutLabel} />
        </div>
        <Suspense>
          <AccountMobileTabs />
        </Suspense>
        <Sections className="gap-5 pt-6 md:pt-0">
          <Suspense>
            <AccountGate>{children}</AccountGate>
          </Suspense>
        </Sections>
      </div>
    </Container>
  );
}

async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireCustomerSession();
  return <>{children}</>;
}

async function UserInfo() {
  const session = await requireCustomerSession();

  return (
    <div>
      <p className="text-sm font-medium">{session.firstName || session.email}</p>
      <p className="text-xs text-muted-foreground">{session.email}</p>
    </div>
  );
}

function UserInfoSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}
