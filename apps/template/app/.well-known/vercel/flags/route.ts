import { getProviderData } from "@flags-sdk/vercel";
import { createFlagsDiscoveryEndpoint } from "flags/next";

import * as flags from "@/lib/flags";

// Serves flag definitions to the Vercel Toolbar Flags Explorer (authenticated via FLAGS_SECRET).
export const GET = createFlagsDiscoveryEndpoint(() => getProviderData(flags));
