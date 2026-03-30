import type { Metadata } from "next";
import { ContentSections } from "./components/content-sections";
import { ShoppingBagScene } from "./components/shopping-bag";

const title = "Vercel Shop";
const description =
  "An agent-native, fast-by-default Shopify storefront built on Next.js. Ship features in minutes, not weeks.";

export const metadata: Metadata = {
  title,
  description,
};

export default function HomePage() {
  return <ShoppingBagScene><ContentSections /></ShoppingBagScene>;
}
