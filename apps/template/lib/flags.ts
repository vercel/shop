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

export const pdpGallery = flag<boolean>({
  adapter: vercelAdapter<boolean, unknown>(),
  defaultValue: false,
  description: "Enable the desktop PDP gallery preview",
  key: "pdp-gallery",
  options: [
    { label: "Default", value: false },
    { label: "Gallery preview", value: true },
  ],
});

// Precomputed in proxy.ts and encoded into the hidden [flags] segment.
export const precomputedFlags = [ctaColor, pdpGallery] as const;
