import { docs } from "./content";

export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

function flatitems(items: unknown[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.href === "string" && typeof record.title === "string") {
      result.push({ title: record.title, href: record.href });
    } else if (typeof record.slug === "string" && typeof record.title === "string") {
      result.push({ title: record.title, href: record.slug ? `/docs/${record.slug}` : "/docs" });
    }
    if (Array.isArray(record.items)) {
      result.push(...flatitems(record.items));
    }
  }
  return result;
}

export async function getDocsNavSections(): Promise<NavSection[]> {
  const navigation = await docs.getNavigation();

  const cleaned = navigation.map((section) => ({
    ...section,
    items: section.items.map(({ type, ...rest }) => rest),
  }));

  const rootSection = cleaned.find((s) => s.title === "Docs" || s.title === "docs");
  const standaloneKeys = new Set(["why use this", "why-use-this"]);
  const merged = cleaned
    .filter((s) => !standaloneKeys.has(s.title.toLowerCase()))
    .map((section) => {
      if (section !== rootSection) return section;
      const extras = cleaned
        .filter((s) => standaloneKeys.has(s.title.toLowerCase()))
        .flatMap((s) => s.items);
      return { ...section, title: "", items: [...section.items, ...extras] };
    });

  return merged
    .map((section) => ({
      title: section.title,
      items: flatitems(section.items),
    }))
    .filter((s) => s.items.length > 0);
}
