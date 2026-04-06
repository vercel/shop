import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AdapterProvider, nextAdapter } from "fromsrc/client";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Chat } from "@/components/fromsrc/chat";
import { Navbar } from "@/components/fromsrc/navbar";
import { Toaster } from "@/components/ui/sonner";
import { docs } from "@/lib/fromsrc/content";
import { mono, pixel, pixelSquare, pixelTriangle, sans } from "@/lib/geistdocs/fonts";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Vercel Shop Documentation",
  description:
    "Documentation for Vercel Shop — an agent-native, fast-by-default Shopify storefront built on Next.js.",
};

function flatitems(items: unknown[]): { title: string; href: string }[] {
  const result: { title: string; href: string }[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.href === "string" && typeof record.title === "string") {
      result.push({ title: record.title, href: record.href });
    } else if (typeof record.slug === "string" && typeof record.title === "string") {
      result.push({ title: record.title, href: record.slug ? `/docs/${record.slug}` : "/docs" });
    }
    if (Array.isArray(record.items)) {
      result.push(...flatitems(record.items));
    }
  }
  return result;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navigation = await docs.getNavigation();

  const cleaned = navigation.map((section) => ({
    ...section,
    items: section.items.map(({ type, ...rest }) => rest),
  }));

  const rootSection = cleaned.find((s) => s.title === "Docs" || s.title === "docs");
  const standaloneKeys = new Set(["why use this", "why-use-this"]);
  const merged = cleaned
    .filter((s) => !standaloneKeys.has(s.title.toLowerCase()))
    .map((section) => {
      if (section !== rootSection) return section;
      const extras = cleaned
        .filter((s) => standaloneKeys.has(s.title.toLowerCase()))
        .flatMap((s) => s.items);
      return { ...section, title: "", items: [...section.items, ...extras] };
    });

  const navSections = merged
    .map((section) => ({
      title: section.title,
      items: flatitems(section.items),
    }))
    .filter((s) => s.items.length > 0);

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
            {children}
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
