"use client";

import { MessagesSquareIcon } from "lucide-react";
import { useChatState } from "@/lib/chatstate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AskAIButtonProps {
  className?: string;
  onClick?: () => void;
}

export const AskAIButton = ({ className, onClick }: AskAIButtonProps) => {
  const { setIsOpen } = useChatState();

  return (
    <Button
      className={cn(
        "gap-1.5 shadow-none font-normal text-gray-1000 bg-background-100 hover:bg-gray-100 hover:text-gray-1000",
        className
      )}
      onClick={() => {
        setIsOpen((prev) => !prev);
        onClick?.();
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      <MessagesSquareIcon className="size-3.5 text-gray-900" aria-hidden="true" />
      <span>Ask AI</span>
    </Button>
  );
};
