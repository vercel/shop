import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

// Value is managed in the Vercel dashboard under flag key `cta-color`.
export const ctaColor = flag<boolean>({
  key: "cta-color",
  defaultValue: false,
  description: "Use the alternate CTA color treatment",
  options: [
    { value: false, label: "Default" },
    { value: true, label: "Alternate" },
  ],
  adapter: vercelAdapter<boolean, unknown>(),
});

// Precomputed in proxy.ts and encoded into the hidden [flags] segment.
export const precomputedFlags = [ctaColor] as const;
