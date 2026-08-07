import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

// CTA color treatment. The value is managed in the Vercel dashboard (flag key
// `cta-color`); the adapter reads it via the FLAGS SDK key. Defaults to false
// when unset or unreachable, and the Vercel Toolbar Flags Explorer can
// override it per session via the discovery endpoint.
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

// Every flag in this group is precomputed in proxy.ts and encoded into the
// hidden [flags] root segment, so pages stay static per flag combination.
export const precomputedFlags = [ctaColor] as const;
