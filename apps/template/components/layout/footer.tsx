import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMenu } from "@/lib/shopify/operations/menu";

const LINK_CLASS =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

function FooterLink({ title, url }: { title: string; url: string }) {
  const isExternal = url.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        {title}
      </a>
    );
  }

  return (
    <Link href={url} className={LINK_CLASS}>
      {title}
    </Link>
  );
}

function FooterHeading({ title, url }: { title: string; url: string }) {
  const isLinkable = url !== "/";
  if (isLinkable) {
    const isExternal = url.startsWith("http");

    if (isExternal) {
      return (
        <h3 className="text-sm font-semibold text-foreground">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {title}
          </a>
        </h3>
      );
    }

    return (
      <h3 className="text-sm font-semibold text-foreground">
        <Link href={url} className="hover:underline">
          {title}
        </Link>
      </h3>
    );
  }

  return <h3 className="text-sm font-semibold text-foreground">{title}</h3>;
}

async function Copyright() {
  await connection();
  const t = await getTranslations("footer");

  return (
    <p className="text-xs text-muted-foreground">
      {t("copyright", { year: String(new Date().getFullYear()) })}
    </p>
  );
}

async function FooterContent({ locale }: { locale: string }) {
  const menu = await getMenu("footer", locale);

  if (!menu || menu.items.length === 0) {
    return null;
  }

  return (
    <footer className="bg-muted/30">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {menu.items.map((column) => (
            <div key={column.id}>
              <FooterHeading title={column.title} url={column.url} />
              {column.items.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.id}>
                      <FooterLink title={item.title} url={item.url} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <Suspense>
            <Copyright />
          </Suspense>
        </div>
      </div>
    </footer>
  );
}

export function Footer({ locale }: { locale: string }) {
  return (
    <Suspense fallback={null}>
      <FooterContent locale={locale} />
    </Suspense>
  );
}
