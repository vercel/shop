"use client";

import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";

export default function RootError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorBoundaryContent retry={retry} />;
}
