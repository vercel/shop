import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account-login" />}>
      {children}
    </Suspense>
  );
}
