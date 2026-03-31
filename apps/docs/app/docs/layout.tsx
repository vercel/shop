import type { ReactNode } from "react";
import { docs } from "@/lib/fromsrc/content";
import { Sidebar } from "fromsrc/client";

export default async function Layout({ children }: { children: ReactNode }) {
  const navigation = await docs.getNavigation();

  // Strip the schema `type` field (guide/reference/etc.) from nav items so it
  // doesn't collide with fromsrc's internal `type` discriminant (item/folder).
  const cleanedNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.map(({ type, ...rest }) => rest),
  }));

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar
        basePath="/docs"
        navigation={cleanedNavigation}
        title="Vercel Shop"
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
