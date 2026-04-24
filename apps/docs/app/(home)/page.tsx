import type { Metadata } from "next";
import Link from "next/link";
import { Installer } from "@/components/fromsrc/installer";
import { Button } from "@/components/ui/button";
import { nav } from "@/lib/constants";
import { homeDescription, siteName } from "@/lib/site";
import { AgentDemo } from "./components/agent-demo";
import { AssistantDemo } from "./components/assistant-demo";
import { CenteredSection } from "./components/centered-section";
import { CommerceEngine } from "./components/commerce-engine";
import { CTA } from "./components/cta";
import { ContentNegotiationDemo } from "./components/content-negotiation-demo";
import { FakeBrowser } from "./components/fake-browser";
import { Hero } from "./components/hero";
import { LogoBar } from "./components/logo-bar";
import { OneTwoSection } from "./components/one-two-section";
import { PromptCopy } from "./components/prompt-copy";
import { WhatYouSkip } from "./components/what-you-skip";

const title = siteName;
const description = homeDescription;
const agentCommand = "npx plugins add vercel/shop";

const deployUrl =
	"https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop%2Ftree%2Fmain%2Fapps%2Ftemplate&env=SHOPIFY_STOREFRONT_ACCESS_TOKEN,SHOPIFY_STORE_DOMAIN,NEXT_PUBLIC_SITE_NAME&envDescription=Required%20values%20to%20work%20with%20Shopify&envLink=https%3A%2F%2Fvercel.shop%2Fdocs%2Freference%2Fenv-vars";

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description,
		type: "website",
		url: "/",
		siteName,
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 628,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: ["/opengraph-image"],
	},
};

const HomePage = () => (
	<div className="container mx-auto max-w-[1114px]">
		<Hero
			badge="Vercel Shop is now in alpha"
			description={description}
			title={title}
		>
			<div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
				<PromptCopy agentCommand={agentCommand} command="npx create-vercel-shop@latest" />
				<Button asChild className="px-4" size="lg">
					<Link href="/docs/getting-started">
						Get Started
					</Link>
				</Button>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					{nav.filter((item) => item.target === "_blank").map((item) => (
						<a key={item.href} href={item.href} className="underline underline-offset-4 hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
							{item.label}
						</a>
					))}
				</div>
			</div>
		</Hero>
		<div className="grid divide-y border-y sm:border-x">
			<LogoBar />
			<CommerceEngine />
			<CenteredSection
				description="Using Cache Components you can instantly show static content while streaming in dynamic data."
				title="Dynamic storefronts with instant static responses"
			>
				<FakeBrowser />
			</CenteredSection>
			<OneTwoSection
				description={
					<>
						<p>
							The vercel-shop plugin and template recipes let agents extend your
							store with a single command. Add markets, CMS, auth, and more.
						</p>
						<p className="mt-3">
							First-party Shopify skills — built and maintained by Shopify —
							let agents extend your store with commerce primitives that stay
							current as the platform evolves.
						</p>
						<div className="mt-4 max-w-[22rem]">
							<Installer
								className="w-full"
								command="npx create-vercel-shop@latest --no-template"
							/>
						</div>
					</>
				}
				title="Agentic development"
				reverse
			>
				<AgentDemo />
			</OneTwoSection>
			<OneTwoSection
				description="Built-in shopping assistant for your store powered by the AI SDK and AI Gateway."
				title="Shopping assistant"
			>
				<AssistantDemo />
			</OneTwoSection>
			<OneTwoSection
				description="As AI agents increasingly shop on behalf of consumers, your storefront needs to be readable by machines — not just humans. Product, collection, and search pages serve structured markdown to LLM agents via the Accept header, making your catalog structured, discoverable, and transactable by any agent."
				title="Built for agentic commerce"
			>
				<ContentNegotiationDemo />
			</OneTwoSection>
			<WhatYouSkip />
			<CTA
				title="Start your shop today"
				description="Pick the path that matches where you are."
				actions={[
					{
						label: "Deploy your store",
						description:
							"One-click deploy from the terminal — ideal for developers who want to ship today.",
						href: deployUrl,
						external: true,
					},
					{
						label: "Explore the docs",
						description:
							"Walk the reference architecture and see how the pieces fit together.",
						href: "/docs",
					},
					{
						label: "Talk to our team",
						description:
							"For enterprise brands and agencies evaluating a joint Shopify + Vercel build.",
						href: "https://vercel.com/contact/sales",
						external: true,
					},
				]}
			/>
		</div>
	</div>
);

export default HomePage;
