import Link from "next/link";

import { siteConfig } from "@/lib/config";
import type { MenuItem } from "@/lib/shopify/types/menu";

import { defaultFooterItems } from "./menu-data";
import { SocialLinks } from "./social-links";

export function Footer({ locale }: { locale: string }) {
  const { socialLinks } = siteConfig;
  const items = defaultFooterItems;

  return (
    <footer>
      <div className="mx-auto px-5 pt-10 pb-22 lg:px-10">
        {items.length > 0 && <FooterMenu items={items} />}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-sm text-muted-foreground leading-5">
            &copy; Vercel Shop. All rights reserved.
          </p>
          {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
        </div>
      </div>
    </footer>
  );
}

interface MenuLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
}

function MenuLink({ url, children, className }: MenuLinkProps) {
  if (url.startsWith("http")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {children}
    </Link>
  );
}

function FooterMenu({ items }: { items: MenuItem[] }) {
  const columns = items.slice(0, 5);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 mb-15">
      {columns.map((column) => (
        <div key={column.id} className="space-y-3">
          {column.url ? (
            <MenuLink
              url={column.url}
              className="block text-sm font-semibold hover:opacity-70 transition-opacity"
            >
              {column.title}
            </MenuLink>
          ) : (
            <h3 className="text-sm font-semibold">{column.title}</h3>
          )}
          {column.items.length > 0 && (
            <ul className="space-y-2">
              {column.items.map((leaf) => (
                <li key={leaf.id}>
                  <MenuLink
                    url={leaf.url}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {leaf.title}
                  </MenuLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
