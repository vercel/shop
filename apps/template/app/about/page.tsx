import type { Metadata } from "next";

import { StorefrontCanvas } from "@/components/storefront/canvas";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${siteConfig.name}.`,
};

export default function AboutPage() {
  return <StorefrontCanvas route="about" />;
}
