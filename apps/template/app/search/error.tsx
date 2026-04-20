"use client";

import { ErrorBoundaryContent } from "@/components/ui/error-boundary-content";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent reset={reset} />;
}
