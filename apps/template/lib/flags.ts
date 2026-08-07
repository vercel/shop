import { flag } from "flags/next";

export const exampleFlag = flag<boolean>({
  key: "example",
  decide: () => false,
});

// Every flag in this group is precomputed in proxy.ts and encoded into the
// hidden [flags] root segment, so pages stay static per flag combination.
export const precomputedFlags = [exampleFlag] as const;
