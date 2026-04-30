import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/geistdocs/docs-sidebar";
import { getDocsNavSections } from "@/lib/fromsrc/nav-sections";

export default async function Layout({ children }: { children: ReactNode }) {
  const navSections = await getDocsNavSections();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1448px]">
      <DocsSidebar navigation={navSections} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
