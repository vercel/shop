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

  // Merge standalone root pages (like why-shop) into the Docs section
  const rootSection = cleanedNavigation.find((s) => s.title === "Docs" || s.title === "docs");
  const standaloneKeys = new Set(["why shop", "why-shop"]);
  const merged = cleanedNavigation
    .filter((s) => !standaloneKeys.has(s.title.toLowerCase()))
    .map((section) => {
      if (section !== rootSection) return section;
      const extras = cleanedNavigation
        .filter((s) => standaloneKeys.has(s.title.toLowerCase()))
        .flatMap((s) => s.items);
      return { ...section, items: [...section.items, ...extras] };
    });

  const sidebarNavigation = [
    {
      title: "",
      items: [
        { type: "item" as const, title: "Demo", href: "https://shop-template.labs.vercel.dev" },
        { type: "item" as const, title: "GitHub", href: "https://github.com/vercel/shop" },
      ],
    },
    ...merged,
  ];

  return (
    <div className="fromsrc flex min-h-screen">
      <Sidebar
        basePath="/docs"
        collapsible
        navigation={sidebarNavigation}
        title="Vercel Shop"
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
