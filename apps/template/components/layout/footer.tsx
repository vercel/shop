import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { siteConfig } from "@/lib/config";

import { SocialLinks } from "./social-links";

async function Copyright() {
  await connection();
  const t = await getTranslations("footer");

  return (
    <p className="text-sm text-muted-foreground leading-5">
      {t("copyright", { year: String(new Date().getFullYear()) })}
    </p>
  );
}

export function Footer({ locale }: { locale: string }) {
  const { socialLinks } = siteConfig;

  return (
    <footer className="bg-muted/30">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Suspense>
            <Copyright />
          </Suspense>
          {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
        </div>
      </div>
    </footer>
  );
}
