import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountMobileTabsComposed } from "@/components/account/mobile-tabs";
import { AccountSidebarComposed } from "@/components/account/sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row gap-6 px-4 lg:px-8 pt-8 min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex shrink-0 w-[240px]">
        <Suspense>
          <AccountSidebarComposed />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Mobile Tabs - hidden on desktop */}
        <Suspense>
          <AccountMobileTabsComposed />
        </Suspense>
        {/* Content Container */}
        <div className="bg-white rounded-t-2xl p-4 sm:p-6 md:p-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
