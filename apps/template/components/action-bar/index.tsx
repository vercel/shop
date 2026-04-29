"use client";

import type { ReactNode } from "react";

interface ActionBarProps {
  children?: ReactNode;
}

export function ActionBar({ children }: ActionBarProps) {
  if (!children) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center bg-link text-link-foreground backdrop-blur-md h-12 rounded-full shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] px-2">
      {children}
    </div>
  );
}
