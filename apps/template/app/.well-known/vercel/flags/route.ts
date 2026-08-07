import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";

import * as flags from "@/lib/flags";

// Discovery endpoint for the Vercel Toolbar Flags Explorer. It reads flag
// definitions from code and lets the toolbar override them per session. Access
// is authenticated with FLAGS_SECRET by createFlagsDiscoveryEndpoint.
export const GET = createFlagsDiscoveryEndpoint(() => getProviderData(flags));
