"use client";

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
        "font-medium text-gray-1000 bg-background-100 hover:bg-gray-100 hover:text-gray-1000",
        className,
      )}
      onClick={() => {
        setIsOpen((prev) => !prev);
        onClick?.();
      }}
      size="sm"
      type="button"
      variant="secondary"
    >
      Ask AI
    </Button>
  );
};
