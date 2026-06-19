"use client";

export default function AccountError({ reset }: { reset: () => void }) {
  return <div data-reset-available={Boolean(reset)} data-storefront-canvas="account-error" />;
}
