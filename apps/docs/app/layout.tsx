import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AdapterProvider, nextAdapter } from "fromsrc/client";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Chat } from "@/components/fromsrc/chat";
import { Footer } from "@/components/fromsrc/footer";
import { Search } from "@/components/fromsrc/search";
import { Navbar } from "@/components/geistdocs/navbar";
import { Toaster } from "@/components/ui/sonner";
import { getDocsNavSections } from "@/lib/fromsrc/nav-sections";
import { mono, pixel, pixelSquare, pixelTriangle, sans } from "@/lib/geistdocs/fonts";
import { docsDescription, docsTitle, getBaseUrl, siteName } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: docsTitle,
  description: docsDescription,
  openGraph: {
    title: docsTitle,
    description: docsDescription,
    siteName,
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 628,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: docsTitle,
    description: docsDescription,
    images: ["/opengraph-image.jpg"],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navSections = await getDocsNavSections();

  return (
    <html
      className={cn(sans.variable, mono.variable, pixel.variable, pixelSquare.variable, pixelTriangle.variable, "antialiased")}
      lang="en"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AdapterProvider adapter={nextAdapter}>
            <Navbar navigation={navSections} />
            <Search />
            {children}
            <Footer />
            <Chat />
            <Toaster />
          </AdapterProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
