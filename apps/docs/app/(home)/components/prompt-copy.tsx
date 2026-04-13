"use client";

import { track } from "@vercel/analytics";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const COPY_TIMEOUT = 2000;

type CopyMode = "cli" | "prompt";

interface PromptCopyProps {
  className?: string;
  command: string;
  prompt: string;
}

export const PromptCopy = ({
  className,
  command,
  prompt,
}: PromptCopyProps) => {
  const [mode, setMode] = useState<CopyMode>("cli");
  const [copied, setCopied] = useState(false);

  const activeOption =
    mode === "cli"
      ? {
          description: "Run the starter directly in your terminal.",
          label: "CLI",
          prefix: "$",
          value: command,
        }
      : {
          description:
            "Paste into your coding agent. It tells the agent to use the CLI, collect Shopify env vars, and stop when local dev is running.",
          label: "Prompt",
          prefix: null,
          value: prompt,
        };

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, COPY_TIMEOUT);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  useEffect(() => {
    setCopied(false);
  }, [mode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeOption.value);
    setCopied(true);
    track(mode === "cli" ? "Copied installer command" : "Copied starter prompt");
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <div className={cn("w-full max-w-3xl space-y-3", className)}>
      <div className="inline-flex rounded-full border bg-background/80 p-1 shadow-xs">
        {(["cli", "prompt"] as const).map((option) => {
          const isActive = option === mode;

          return (
            <button
              key={option}
              aria-pressed={isActive}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMode(option)}
              type="button"
            >
              {option === "cli" ? "CLI" : "Prompt"}
            </button>
          );
        })}
      </div>
      <InputGroup className="h-10 bg-background shadow-none text-sm overflow-hidden">
        {activeOption.prefix ? (
          <InputGroupAddon>
            <InputGroupText className="font-mono font-normal text-muted-foreground">
              {activeOption.prefix}
            </InputGroupText>
          </InputGroupAddon>
        ) : null}
        <InputGroupInput
          className="min-w-0 font-mono text-sm"
          readOnly
          title={activeOption.value}
          value={activeOption.value}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={`Copy ${activeOption.label.toLowerCase()}`}
            className="hover:bg-muted hover:text-foreground"
            onClick={handleCopy}
            size="icon-xs"
            title={`Copy ${activeOption.label.toLowerCase()}`}
          >
            <Icon className="size-3.5" size={14} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="text-sm text-muted-foreground">{activeOption.description}</p>
    </div>
  );
};
