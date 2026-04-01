/**
 * UCP Discovery Profile Endpoint
 * GET /.well-known/ucp
 *
 * Returns the UCP discovery profile describing this business's
 * capabilities, supported transports, and endpoints.
 */

import { siteConfig } from "@/lib/config";
import { generateProfile } from "@/lib/ucp/profile";

export async function GET(): Promise<Response> {
  const baseUrl = siteConfig.url || "https://localhost:3000";
  const profile = generateProfile(baseUrl);

  return Response.json(profile, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
    },
  });
}
