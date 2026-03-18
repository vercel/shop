import { ShoppingBagIcon } from "lucide-react";

export const Logo = () => (
	<div className="flex items-center gap-2">
		<ShoppingBagIcon className="size-5" />
		<p className="font-semibold text-xl tracking-tight">Shop</p>
	</div>
);

export const github = {
	owner: "vercel",
	repo: "shop",
};

export const nav = [
	{
		label: "Docs",
		href: "/docs",
	},
	{
		label: "Source",
		href: `https://github.com/${github.owner}/${github.repo}/`,
	},
];

export const suggestions = [
	"What is Vercel Shop?",
	"How can I localize my Vercel Shop site?",
	"How do I deploy my Vercel Shop site?",
];

export const title = "Vercel Shop Documentation";

export const prompt =
	"You are a helpful assistant specializing in answering questions about Vercel Shop, the standard for Shopify development.";

export const translations = {
	en: {
		displayName: "English",
	},
};

export const basePath: string | undefined = undefined;

/**
 * Unique identifier for this site, used in markdown request tracking analytics.
 * Each site using geistdocs should set this to a unique value (e.g. "ai-sdk-docs", "next-docs").
 */
export const siteId: string | undefined = undefined;
