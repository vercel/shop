import type { ReactNode } from "react";
import { docs } from "@/lib/fromsrc/content";
import Link from "next/link";

export default async function Layout({ children }: { children: ReactNode }) {
  const navigation = await docs.getNavigation();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r p-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      className="block rounded-md px-2 py-1 text-sm hover:bg-muted"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
