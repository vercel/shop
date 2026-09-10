"use client";

import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";

export default function CollectionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent reset={reset} />;
}
