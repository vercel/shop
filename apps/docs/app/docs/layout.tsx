import type { ReactNode } from "react";
import { docs } from "@/lib/fromsrc/content";
import { DocsSidebar, type DocsSidebarSection } from "@/components/fromsrc/docs-sidebar";

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

  const comingSoonBySlug = new Map([
    ["skills/enable-content-summarization", "Coming soon"],
    ["skills/enable-virtual-try-on", "Coming soon"],
  ]);

  const sidebarNavigation: DocsSidebarSection[] = merged.map((section) => ({
    ...section,
    items: section.items.flatMap((item) => {
      if (typeof item.slug !== "string" || typeof item.title !== "string") {
        return [];
      }

      return [
        {
          title: item.title,
          href: item.slug ? `/docs/${item.slug}` : "/docs",
          badge: comingSoonBySlug.get(item.slug),
        },
      ];
    }),
  }));

  return (
    <>
      <div className="fromsrc flex min-h-[calc(100vh-4rem)]">
        <DocsSidebar collapsible navigation={sidebarNavigation} title="Shop" />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  );
}
