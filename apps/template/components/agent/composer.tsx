"use client";

import { cn } from "cn";
import { CornerDownLeftIcon, Loader2Icon, SquareIcon, XIcon } from "lucide-react";
import type { KeyboardEvent } from "react";

import { InputGroup, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";

type AgentStatus = "error" | "ready" | "streaming" | "submitted";

interface AgentComposerProps {
  value: string;
  onChange: (value: string) => void;
  onStop: () => void;
  onSubmit: (text: string) => void;
  status: AgentStatus;
  placeholder?: string;
  className?: string;
}

export function AgentComposer({
  value,
  onChange,
  onStop,
  onSubmit,
  status,
  placeholder,
  className,
}: AgentComposerProps) {
  const isBusy = status === "submitted" || status === "streaming";
  const submit = () => {
    if (status === "streaming") {
      onStop();
      return;
    }
    const text = value.trim();
    if (!text || isBusy) return;
    onSubmit(text);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };
  let icon = <CornerDownLeftIcon className="size-4" />;
  if (status === "submitted") icon = <Loader2Icon className="size-4 animate-spin" />;
  else if (status === "streaming") icon = <SquareIcon className="size-4" />;
  else if (status === "error") icon = <XIcon className="size-4" />;
  const isStopping = status === "streaming";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn("px-5 py-2.5", className)}
    >
      <InputGroup className="h-auto flex-row items-end rounded-2xl border-0 bg-input shadow-none">
        <InputGroupTextarea
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="field-sizing-content max-h-48 min-h-11 py-2.5 text-sm"
        />
        <InputGroupButton
          type="submit"
          size="icon-sm"
          variant="default"
          aria-label={isStopping ? "Stop" : "Send"}
          disabled={!value.trim() && !isStopping}
          className="mr-1.5 mb-1.5"
        >
          {icon}
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}
