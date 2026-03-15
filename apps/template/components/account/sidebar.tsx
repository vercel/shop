import { HistoryIcon, PackageIcon, UserPenIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";

function AccountSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="account-sidebar"
      className={cn(
        "flex w-full flex-col justify-between gap-4 pt-3 pr-4 pb-6 h-full",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

function AccountSidebarNav({
  className,
  children,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="account-sidebar-nav"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {children}
    </nav>
  );
}

interface AccountSidebarHeaderProps extends React.ComponentProps<"div"> {
  title?: string;
}

function AccountSidebarHeader({
  title = "Settings",
  className,
  ...props
}: AccountSidebarHeaderProps) {
  return (
    <div
      data-slot="account-sidebar-header"
      className={cn("flex items-center gap-2 px-3", className)}
      {...props}
    >
      <span className="text-lg font-medium text-foreground">{title}</span>
    </div>
  );
}

function AccountSidebarNavList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="account-sidebar-nav-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface AccountSidebarNavItemProps extends React.ComponentProps<typeof Link> {
  icon: React.ReactNode;
  isActive?: boolean;
}

function AccountSidebarNavItem({
  icon,
  isActive = false,
  className,
  children,
  ...props
}: AccountSidebarNavItemProps) {
  return (
    <Link
      data-slot="account-sidebar-nav-item"
      data-active={isActive ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-1.5 rounded border border-transparent",
        "text-base font-normal text-foreground",
        // Active state
        "data-[active=true]:bg-muted data-[active=true]:font-medium",
        "data-[active=true]:[&_svg]:text-primary data-[active=true]:[&_svg]:opacity-100",
        // Inactive state
        "[&_svg]:opacity-30 [&_svg]:text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </Link>
  );
}

function AccountSidebarFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="account-sidebar-footer"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface AccountSidebarHelpProps extends React.ComponentProps<"div"> {
  label?: string;
  linkText?: string;
  href?: string;
}

function AccountSidebarHelp({
  label = "Need help?",
  linkText = "Reach out support",
  href = "/support",
  className,
  ...props
}: AccountSidebarHelpProps) {
  return (
    <div
      data-slot="account-sidebar-help"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <span className="text-xs font-normal text-secondary-foreground opacity-40">
        {label}
      </span>
      <Link href={href} className="text-lg font-medium text-foreground">
        {linkText}
      </Link>
    </div>
  );
}

const accountNavItems = [
  {
    href: "/account/profile",
    labelKey: "profile" as const,
    icon: UserPenIcon,
    matchExact: true,
  },
  {
    href: "/account/orders",
    labelKey: "orderHistory" as const,
    icon: HistoryIcon,
    matchExact: false,
  },
  {
    href: "/account/addresses",
    labelKey: "addressBook" as const,
    icon: PackageIcon,
    matchExact: false,
  },
] as const;

export {
  AccountSidebar,
  AccountSidebarNav,
  AccountSidebarHeader,
  AccountSidebarNavList,
  AccountSidebarNavItem,
  AccountSidebarFooter,
  AccountSidebarHelp,
  accountNavItems,
};
