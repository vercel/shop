"use client";

import { track } from "@vercel/analytics";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const COPY_TIMEOUT = 2000;

const EXAMPLE_PROMPTS = [
  {
    id: "shopping-assistant",
    title: "Build a shopping assistant",
    description: "Add an AI-powered assistant that recommends products and updates cart state.",
    prompt:
      "Add an AI shopping assistant to the template storefront using AI SDK and AI Gateway. It should answer product questions from our catalog, recommend products by intent, and support add-to-cart actions with optimistic UI. Include server route changes, UI updates, and a short test plan.",
  },
  {
    id: "agent-readable-pages",
    title: "Make product pages agent-readable",
    description: "Serve structured markdown from product pages for LLM agents via Accept headers.",
    prompt:
      "Implement content negotiation for product detail routes so browser requests return HTML while agent requests can receive structured markdown. Reuse our existing catalog data, include SEO-safe defaults, and add docs explaining how clients request markdown responses.",
  },
  {
    id: "skills-and-recipe",
    title: "Ship a new skill recipe",
    description: "Extend agent workflows with a reusable skill and docs for one-command setup.",
    prompt:
      "Create a new skill recipe that helps merchants launch a localized market experience (currency, locale copy, and region-specific merchandising). Add implementation steps for apps/template and corresponding docs updates in apps/docs so the feature can be installed with one command.",
  },
] as const;

export const ExamplePrompts = () => {
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const handleCopy = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Copied prompt to clipboard");
    setCopiedPromptId(id);
    track("Copied example prompt", { promptId: id });

    setTimeout(() => {
      setCopiedPromptId((currentPromptId) => (currentPromptId === id ? null : currentPromptId));
    }, COPY_TIMEOUT);
  };

  return (
    <section className="grid gap-10 px-4 py-8 sm:px-12 sm:py-12">
      <div className="mx-auto grid max-w-2xl gap-4 text-center">
        <h2 className="font-pixel-square font-normal text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl lg:text-[40px]">
          Build with AI prompt examples
        </h2>
        <p className="text-balance text-lg text-muted-foreground">
          Start common Vercel Shop workflows with ready-to-copy prompts tailored for your coding agent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {EXAMPLE_PROMPTS.map((item) => {
          const Icon = copiedPromptId === item.id ? CheckIcon : CopyIcon;
          const isCopied = copiedPromptId === item.id;

          return (
            <article key={item.id} className="flex h-full flex-col rounded-lg border bg-background p-4">
              <div className="grid gap-2">
                <h3 className="font-pixel-square font-normal text-base tracking-tight dark:text-white sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-pretty text-muted-foreground text-sm">{item.description}</p>
              </div>
              <pre className="mt-4 flex-1 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {item.prompt}
              </pre>
              <Button
                className="mt-4 w-full"
                onClick={() => handleCopy(item.id, item.prompt)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Icon className="size-3.5" size={14} />
                {isCopied ? "Copied" : "Copy install prompt"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
