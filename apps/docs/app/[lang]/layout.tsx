import "../global.css";
import "@/lib/geistdocs/site-url-warning";
import { Footer } from "@vercel/geistdocs/footer";
import { Navbar } from "@vercel/geistdocs/navbar";
import { cn } from "cn";
import type { Metadata } from "next";

import { GeistdocsProvider } from "@/components/geistdocs/provider";
import { config } from "@/lib/geistdocs/config";
import { mono, sans } from "@/lib/geistdocs/fonts";
import { i18n } from "@/lib/geistdocs/i18n";
import { getRootLang } from "@/lib/geistdocs/root-params";
import { isSiteUrlConfigured, siteUrl } from "@/lib/geistdocs/site-url";

export const generateStaticParams = () => i18n.languages.map((lang) => ({ lang }));

export const metadata: Metadata = {
  metadataBase: isSiteUrlConfigured ? siteUrl : undefined,
};

const Layout = async ({ children }: LayoutProps<"/[lang]">) => {
  const lang = await getRootLang();

  return (
    <html
      className={cn(sans.variable, mono.variable, "antialiased")}
      lang={lang}
      suppressHydrationWarning
    >
      <body>
        <GeistdocsProvider basePath={config.basePath} lang={lang}>
          <Navbar config={config} />
          {children}
          <Footer />
        </GeistdocsProvider>
      </body>
    </html>
  );
};

export default Layout;
