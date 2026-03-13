"use client";

import { LogOutIcon, PackageIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  SelectPanel,
  SelectPanelContent,
  SelectPanelDivider,
  SelectPanelGrid,
  SelectPanelHeader,
  SelectPanelSection,
  SelectPanelTrigger,
} from "@/components/ui/select-panel";
import { signOut } from "@/lib/auth/client";

function truncateEmail(email: string): string {
  if (email.length <= 6) return email;
  return `${email.slice(0, 3)}...${email.slice(-3)}`;
}

type AccountClientProps = {
  email: string;
  translations: {
    account: string;
    profile: string;
    orders: string;
    signOut: string;
  };
};

export function AccountClient({ email, translations: t }: AccountClientProps) {
  const [open, setOpen] = useState(false);
  const displayName = email.split("@")[0] || t.account;
  const avatarInitial = email[0]?.toUpperCase() || "U";

  return (
    <SelectPanel open={open} onOpenChange={setOpen}>
      <SelectPanelTrigger>
        <span className="flex items-center gap-2 px-3 py-2">
          <span className="relative w-8 h-8">
            <span className="absolute inset-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <UserIcon className="w-4 h-4" />
            </span>
            <span className="absolute inset-0 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground animate-in fade-in duration-300">
              {avatarInitial}
            </span>
          </span>
          <span className="hidden lg:flex flex-col leading-tight w-18">
            <span className="text-xs font-semibold text-foreground">
              {t.account}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {truncateEmail(email)}
            </span>
          </span>
        </span>
      </SelectPanelTrigger>
      <SelectPanelContent align="end" title={t.account}>
        <SelectPanelSection>
          <SelectPanelHeader title={t.account} subtitle={displayName} />
          <SelectPanelGrid columns={2}>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-1 py-1 rounded text-left transition-colors hover:bg-accent outline-none focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex items-center gap-2">
                <span className="shrink-0 w-8 h-6 flex items-center justify-center">
                  <UserIcon className="size-4" />
                </span>
                <span className="text-sm font-medium">{t.profile}</span>
              </span>
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-1 py-1 rounded text-left transition-colors hover:bg-accent outline-none focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex items-center gap-2">
                <span className="shrink-0 w-8 h-6 flex items-center justify-center">
                  <PackageIcon className="size-4" />
                </span>
                <span className="text-sm font-medium">{t.orders}</span>
              </span>
            </Link>
          </SelectPanelGrid>
        </SelectPanelSection>
        <SelectPanelDivider />
        <div className="flex items-center px-6 py-3">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
          >
            <LogOutIcon className="size-3.5" />
            {t.signOut}
          </button>
        </div>
      </SelectPanelContent>
    </SelectPanel>
  );
}
