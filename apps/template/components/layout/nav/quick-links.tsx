import Link from "next/link";

import { getMenu } from "@/lib/shopify/operations/menu";

export async function QuickLinks({ locale }: { locale: string }) {
  const menu = await getMenu("main-menu", locale);

  if (!menu || menu.items.length === 0) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center gap-6">
      {menu.items.map((item) => {
        const isExternal = item.url.startsWith("http");

        if (isExternal) {
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm hover:opacity-70 focus-visible:opacity-70 transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm"
            >
              {item.title}
            </a>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.url}
            className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity"
          >
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}
