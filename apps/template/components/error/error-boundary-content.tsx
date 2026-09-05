"use client";

import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ErrorBoundaryContent({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center lg:py-10">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted p-5">
          <AlertCircleIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl lg:text-3xl">Something went wrong</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}
