import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const ogAssetDir = join(process.cwd(), "app/og/[...slug]");

const ogAssets = Promise.all([
  readFile(join(ogAssetDir, "geist-sans-regular.ttf")),
  readFile(join(ogAssetDir, "geist-sans-semibold.ttf")),
  readFile(join(ogAssetDir, "background.png")),
]).then(([regularFont, semiboldFont, backgroundImage]) => ({
  regularFont,
  semiboldFont,
  backgroundImageData: backgroundImage.buffer.slice(
    backgroundImage.byteOffset,
    backgroundImage.byteOffset + backgroundImage.byteLength
  ),
}));

export const ogImageSize = {
  width: 1200,
  height: 628,
} as const;

export const ogImageContentType = "image/png";

interface OgImageContent {
  title: string;
  description?: string | null;
}

export async function createOgImageResponse({
  title,
  description,
}: OgImageContent) {
  const { backgroundImageData, regularFont, semiboldFont } = await ogAssets;

  return new ImageResponse(
    <div style={{ fontFamily: "Geist" }} tw="flex h-full w-full bg-black">
      {/** biome-ignore lint/performance/noImgElement: Satori requires img */}
      <img
        alt="Vercel Shop Open Graph Background"
        height={ogImageSize.height}
        src={backgroundImageData as never}
        width={ogImageSize.width}
      />
      <div tw="absolute left-[50px] flex h-full w-[750px] flex-col justify-center pt-[116px] pr-[50px] pb-[86px]">
        <div
          style={{ textWrap: "balance" }}
          tw="mb-4 flex text-5xl leading-[1.1] font-medium tracking-tight text-white"
        >
          {title}
        </div>
        {description ? (
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
        ) : null}
      </div>
    </div>,
    {
      ...ogImageSize,
      fonts: [
        { name: "Geist", data: regularFont, weight: 400 },
        { name: "Geist", data: semiboldFont, weight: 500 },
      ],
    }
  );
}
