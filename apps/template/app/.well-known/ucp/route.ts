import { shopConfig } from "@/lib/config";
import { getUcpProfile } from "@/lib/ucp/server";
import { notFound } from "next/navigation";

export async function GET(request: Request): Promise<Response> {
  if (!shopConfig.ucp.isEnabled) {
    return notFound();
  }

  return getUcpProfile(request);
}
