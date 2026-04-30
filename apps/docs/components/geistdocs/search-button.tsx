"use client";

import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function openSearchDialog() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, key: "k", metaKey: true })
  );
}

interface SearchButtonProps {
  className?: string;
  onClick?: () => void;
}

export const SearchButton = ({ className, onClick }: SearchButtonProps) => {
  return (
    <Button
      className={cn(
        "group justify-between gap-8 pr-1.5 font-normal text-gray-900 shadow-none lg:h-8 lg:w-[150px] lg:bg-background-200 hover:lg:bg-background-200",
        "h-10",
        className
      )}
      onClick={() => {
        openSearchDialog();
        onClick?.();
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      <span>Search...</span>
      <Kbd className="border bg-background-100 font-medium transition-colors group-hover:text-gray-1000">
        ⌘K
      </Kbd>
    </Button>
  );
};
