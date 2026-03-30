import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { docs } from "@/lib/fromsrc/content";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  // Last segment is "image.png", strip it
  const docSlug = slug.slice(0, -1);
  const doc = await docs.getDoc(docSlug);

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const { title, description } = doc;

  const regularFont = await readFile(
    join(process.cwd(), "app/og/[...slug]/geist-sans-regular.ttf")
  );

  const semiboldFont = await readFile(
    join(process.cwd(), "app/og/[...slug]/geist-sans-semibold.ttf")
  );

  const backgroundImage = await readFile(
    join(process.cwd(), "app/og/[...slug]/background.png")
  );

  const backgroundImageData = backgroundImage.buffer.slice(
    backgroundImage.byteOffset,
    backgroundImage.byteOffset + backgroundImage.byteLength
  );

  return new ImageResponse(
    <div style={{ fontFamily: "Geist" }} tw="flex h-full w-full bg-black">
      {/** biome-ignore lint/performance/noImgElement: "Required for Satori" */}
      <img
        alt="Vercel OpenGraph Background"
        height={628}
        src={backgroundImageData as never}
        width={1200}
      />
      <div tw="flex flex-col absolute h-full w-[750px] justify-center left-[50px] pr-[50px] pt-[116px] pb-[86px]">
        <div
          style={{ textWrap: "balance" }}
          tw="text-5xl font-medium text-white tracking-tight flex leading-[1.1] mb-4"
        >
          {title}
        </div>
        <div
          style={{
            color: "#8B8B8B",
            lineHeight: "44px",
            textWrap: "balance",
          }}
          tw="text-[32px]"
        >
          {description}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 628,
      fonts: [
        { name: "Geist", data: regularFont, weight: 400 },
        { name: "Geist", data: semiboldFont, weight: 500 },
      ],
    }
  );
}

export async function generateStaticParams() {
  const allDocs = await docs.getAllDocs();
  return allDocs.map((doc) => ({
    slug: [...(doc.slug ? doc.slug.split("/") : []), "image.png"],
  }));
}
