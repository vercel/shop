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
          label: "For humans",
          prefix: "$",
          value: command,
        }
      : {
          label: "For agents",
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
    <div className={cn("mx-auto w-full max-w-[36rem] space-y-2", className)}>
      <div className="flex w-fit items-center gap-6">
        {(["cli", "prompt"] as const).map((option) => {
          const isActive = option === mode;

          return (
            <button
              key={option}
              aria-pressed={isActive}
              className={cn(
                "border-b px-0 pb-1 text-sm transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMode(option)}
              type="button"
            >
              {option === "cli" ? "For humans" : "For agents"}
            </button>
          );
        })}
      </div>
      <InputGroup className="h-10 w-full bg-background shadow-none text-sm overflow-hidden">
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
    </div>
  );
};
