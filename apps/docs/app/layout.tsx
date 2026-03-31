import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Footer } from "@/components/geistdocs/footer";
import { Navbar } from "@/components/geistdocs/navbar";
import { Toaster } from "@/components/ui/sonner";
import { mono, pixel, pixelSquare, pixelTriangle, sans } from "@/lib/geistdocs/fonts";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

export const metadata = {
  title: "Vercel Shop Documentation",
  description:
    "Documentation for Vercel Shop — an agent-native, fast-by-default Shopify storefront built on Next.js.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={cn(sans.variable, mono.variable, pixel.variable, pixelSquare.variable, pixelTriangle.variable, "antialiased")}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
