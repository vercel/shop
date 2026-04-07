import { defineConfig } from "fromsrc";

export default defineConfig({
  title: "Vercel Shop",
  description:
    "Documentation for Vercel Shop — an agent-native, fast-by-default commerce storefront built on Next.js.",
  docsDir: "content/docs",
  theme: "dark",
  sidebar: {
    defaultOpen: true,
    collapsible: true,
  },
  editUrl: "https://github.com/vercel/shop/edit/main/apps/docs",
  lastUpdated: true,
});
