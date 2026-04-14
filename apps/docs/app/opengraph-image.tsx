import { createOgImageResponse, ogImageContentType, ogImageSize } from "@/lib/og";
import { homeDescription, siteName } from "@/lib/site";

export const runtime = "nodejs";

export const alt = `${siteName} preview image`;

export const size = ogImageSize;

export const contentType = ogImageContentType;

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: siteName,
    description: homeDescription,
  });
}
