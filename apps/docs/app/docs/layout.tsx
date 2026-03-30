import type { ReactNode } from "react";
import { docs } from "@/lib/fromsrc/content";
import { DocsSidebar } from "./sidebar";

export default async function Layout({ children }: { children: ReactNode }) {
  const navigation = await docs.getNavigation();
  const allDocs = await docs.getAllDocs();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DocsSidebar navigation={navigation} docs={allDocs} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
