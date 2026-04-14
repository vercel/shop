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
  agentCommand: string;
}

export const PromptCopy = ({
  className,
  command,
  agentCommand,
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
          prefix: "$",
          value: agentCommand,
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
    track(mode === "cli" ? "Copied installer command" : "Copied agent install command");
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <div className={cn("mx-auto flex w-full max-w-[34rem] flex-col items-center gap-2", className)}>
      <div className="flex w-full items-center justify-center gap-6">
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
