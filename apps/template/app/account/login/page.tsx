import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth";

import { LoginRedirect } from "./login-redirect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  return {
    title: t("loginTitle"),
    robots: { index: false, follow: false },
  };
}

export default function LoginPage() {
  if (!isAuthEnabled) notFound();
  return <LoginRedirect />;
}
