import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccountMobileTabs } from "@/components/account/mobile-tabs";
import { AccountSidebar } from "@/components/account/sidebar";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Container className="flex flex-1 flex-col gap-6 md:flex-row md:gap-10">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-24 flex flex-col gap-6">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo />
          </Suspense>
          <AccountSidebar />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between md:hidden">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo />
          </Suspense>
          <SignOutButton />
        </div>
        <AccountMobileTabs />
        <div className="pt-6 md:pt-0">
          <Suspense>
            <AccountGate>{children}</AccountGate>
          </Suspense>
        </div>
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
