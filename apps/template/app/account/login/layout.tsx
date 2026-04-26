import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth";
import { t } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await t("seo.loginTitle"),
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthEnabled) notFound();

  return children;
}
