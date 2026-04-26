"use client";

import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryContentProps {
  errorLabel: string;
  errorDescLabel: string;
  goHomeLabel: string;
  reset: () => void;
  tryAgainLabel: string;
}

export function ErrorBoundaryContent({
  errorLabel,
  errorDescLabel,
  goHomeLabel,
  reset,
  tryAgainLabel,
}: ErrorBoundaryContentProps) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center lg:py-10">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted p-5">
          <AlertCircleIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl font-medium lg:text-3xl">{errorLabel}</h1>
      <p className="mb-8 max-w-md text-muted-foreground">{errorDescLabel}</p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={reset}>{tryAgainLabel}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{goHomeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
