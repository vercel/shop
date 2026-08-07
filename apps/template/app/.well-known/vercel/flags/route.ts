import { getProviderData } from "@flags-sdk/vercel";
import { createFlagsDiscoveryEndpoint } from "flags/next";

import * as flags from "@/lib/flags";

// Discovery endpoint for the Vercel Toolbar Flags Explorer. getProviderData
// from @flags-sdk/vercel enriches definitions with the Vercel flag origin so
// the toolbar can link back to the dashboard and override values per session.
// Access is authenticated with FLAGS_SECRET by createFlagsDiscoveryEndpoint.
export const GET = createFlagsDiscoveryEndpoint(() => getProviderData(flags));
