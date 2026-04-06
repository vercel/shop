import type { ReactNode } from "react";
import { docs } from "@/lib/fromsrc/content";
import { Sidebar } from "fromsrc/client";

export default async function Layout({ children }: { children: ReactNode }) {
  const navigation = await docs.getNavigation();

  const cleanedNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.map(({ type, ...rest }) => rest),
  }));

  const rootSection = cleanedNavigation.find((s) => s.title === "Docs" || s.title === "docs");
  const standaloneKeys = new Set(["why use this", "why-use-this"]);
  const merged = cleanedNavigation
    .filter((s) => !standaloneKeys.has(s.title.toLowerCase()))
    .map((section) => {
      if (section !== rootSection) return section;
      const extras = cleanedNavigation
        .filter((s) => standaloneKeys.has(s.title.toLowerCase()))
        .flatMap((s) => s.items);
      return { ...section, title: "", items: [...section.items, ...extras] };
    });

  const sidebarNavigation = merged;

  return (
    <>
      <div className="fromsrc flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          basePath="/docs"
          defaultOpenLevel={2}
          navigation={sidebarNavigation}
          title="Shop"
        />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  );
}
