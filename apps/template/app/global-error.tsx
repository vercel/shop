"use client";

import { AlertCircleIcon } from "lucide-react";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted p-5">
              <AlertCircleIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight lg:text-3xl">
            Something went wrong
          </h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center h-12 rounded-lg bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
