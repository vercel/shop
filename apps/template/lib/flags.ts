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
  description: "Use the desktop PDP thumbnail gallery",
  key: "pdp-gallery",
  options: [
    { label: "Default", value: false },
    { label: "Thumbnail gallery", value: true },
  ],
});

export const showAgent = flag<boolean>({
  adapter: vercelAdapter<boolean, unknown>(),
  defaultValue: false,
  description: "Show the Shop Agent trigger in the action bar",
  key: "show-agent",
  options: [
    { label: "Hidden", value: false },
    { label: "Shown", value: true },
  ],
});

// Precomputed in proxy.ts and encoded into the hidden [flags] segment.
export const precomputedFlags = [ctaColor, pdpGallery, showAgent] as const;
