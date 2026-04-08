"use client";

import { track } from "@vercel/analytics";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const COPY_TIMEOUT = 2000;

const EXAMPLE_PROMPTS = [
  {
    id: "single-product-drop",
    title: "Single-product drop store",
    description: "Launch a fast hype-drop storefront for one hero product with urgency built in.",
    prompt:
      "Turn this project into a single-product drop store for a limited sneaker release. Replace homepage demos with a launch countdown, product story section, social proof strip, and a sticky buy panel. Keep checkout flow intact, add tasteful motion, and include a concise README on how to swap in a new drop later.",
  },
  {
    id: "subscription-coffee",
    title: "Subscription coffee store",
    description: "Create a cozy DTC coffee shop with one-time and subscription purchase paths.",
    prompt:
      "Create an example coffee subscription storefront with three blends, delivery cadence options, and a simple build-a-box experience. Update copy, imagery placeholders, and merchandising blocks so it feels like a complete vertical store, not a generic template. Keep the code modular so this example can be reused as a starter.",
  },
  {
    id: "b2b-wholesale-catalog",
    title: "B2B wholesale catalog",
    description: "Model a wholesale-first store experience with MOQ and tiered pricing patterns.",
    prompt:
      "Build a B2B wholesale example store for boutique retailers. Add collection pages with case-pack quantities, tiered price messaging, and a request-a-quote flow for large orders. Rework homepage and product page structure to highlight wholesale trust signals and operational details while preserving existing architecture.",
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
          Build example stores with prompts
        </h2>
        <p className="text-balance text-lg text-muted-foreground">
          Use ready-to-copy prompts to generate complete example storefronts you can use like demos or template starting points.
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
                {isCopied ? "Copied" : "Copy store prompt"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
