import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
import { getShopPolicies } from "@/lib/shopify/operations/policies";
import type { MenuItem } from "@/lib/shopify/types/menu";
import { cn } from "@/lib/utils";
import { shopConfig } from "@/shop.config";

import { SocialLinks } from "./social-links";

export async function Footer({ locale }: { locale: string }) {
  const { socialLinks } = shopConfig.site;
  const items = shopConfig.navigation.footer;
  const [policies, t] = await Promise.all([
    getShopPolicies({ locale }).catch(() => []),
    getTranslations("footer"),
  ]);

  return (
    <footer>
      {/* pb-22 clears the fixed agent ActionBar pill when it renders */}
      <Container className={cn("pt-20 pb-10", shopConfig.agent.enabled && "pb-22")}>
        <Sections className="gap-10">
          {items.length > 0 && <FooterMenu items={items} />}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
              <p className="text-sm text-muted-foreground leading-5">
                {t("copyright", { name: shopConfig.site.name })}
              </p>
              {policies.map((policy) => (
                <Link
                  key={policy.handle}
                  href={`/policies/${policy.handle}`}
                  className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {policy.title}
                </Link>
              ))}
            </div>
            {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
          </div>
        </Sections>
      </Container>
    </footer>
  );
}

interface MenuLinkProps {
  children: React.ReactNode;
  className?: string;
  url: string;
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10">
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
