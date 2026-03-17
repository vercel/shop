import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");

  return {
    title: t("loginTitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
