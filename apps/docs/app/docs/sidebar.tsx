"use client";

import type { DocMeta } from "fromsrc";
import { Sidebar, MobileNav, type SidebarSection } from "fromsrc/client";

interface DocsSidebarProps {
  navigation: SidebarSection[];
  docs: DocMeta[];
}

export function DocsSidebar({ navigation, docs }: DocsSidebarProps) {
  return (
    <>
      <div className="hidden md:block sticky top-16 h-[calc(100vh-4rem)]">
        <Sidebar
          title="Shop"
          navigation={navigation}
          basePath="/docs"
          github="https://github.com/vercel/shop"
          collapsible
        />
      </div>
      <div className="md:hidden">
        <MobileNav
          title="Shop"
          navigation={navigation}
          docs={docs}
          basePath="/docs"
        />
      </div>
    </>
  );
}
