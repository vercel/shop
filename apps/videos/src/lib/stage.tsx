import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type StageLayout = "split" | "full";

const ZOOM_START = 16;

/** Frames the demo timelines wait in full layout so the zoom finishes first. */
export const FULL_CONTENT_DELAY = 30;

/**
 * Shared 16:9 backdrop for every clip, laid out like the OG images:
 * kicker + headline left-aligned in a text column, demo card filling the
 * right side. `layout="full"` drops the text and maximizes the card for
 * pure-demo clips. Cards are authored at the docs page's natural size and
 * scaled as one group so type and spacing stay identical to the homepage.
 */
export const Stage = ({
  children,
  kicker,
  title,
  width = 620,
  scale,
  layout = "split",
  entranceDelay = 0,
  theme = "light",
}: {
  children: ReactNode;
  kicker?: string;
  title?: string;
  width?: number;
  scale?: number;
  layout?: StageLayout;
  entranceDelay?: number;
  theme?: "light" | "dark";
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hasText = layout === "split" && Boolean(kicker || title);
  // Full layout: the window frame loads in at a smaller size, then a quick
  // fluid zoom brings it to full scale before the content starts playing
  // (compositions delay their timelines by FULL_CONTENT_DELAY).
  const tightScale = scale ?? (hasText ? 1.7 : 2.7);
  const zoomIn = spring({
    frame: frame - ZOOM_START,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const cardScale = hasText
    ? tightScale
    : interpolate(zoomIn, [0, 1], [tightScale * 0.72, tightScale]);

  const enter = spring({
    frame: frame - entranceDelay,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  });
  const rise = interpolate(enter, [0, 1], [14, 0]);

  return (
    <AbsoluteFill className={theme === "dark" ? "dark" : undefined}>
      <AbsoluteFill className="bg-background-200 font-sans text-foreground antialiased">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(80% 60% at 50% 0%, oklch(1 0 0 / 0.05), transparent)"
                : "radial-gradient(80% 60% at 50% 0%, oklch(1 0 0 / 0.9), transparent)",
          }}
        />
        {hasText ? (
          <div className="relative flex h-full w-full items-center gap-[70px] pl-[110px] pr-[80px]">
            <div
              className="flex w-[520px] flex-none flex-col items-start gap-5"
              style={{ opacity: enter, transform: `translateY(${rise}px)` }}
            >
              {kicker && (
                <span className="font-mono text-[15px] uppercase tracking-[0.16em] text-gray-800">
                  {kicker}
                </span>
              )}
              {title && (
                <h1 className="text-[52px] font-normal leading-[1.12] tracking-[-0.03em] text-foreground">
                  {title}
                </h1>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div
                style={{
                  width,
                  transform: `scale(${cardScale}) translateY(${rise / cardScale}px)`,
                  opacity: enter,
                }}
              >
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              style={{
                width,
                transform: `scale(${cardScale}) translateY(${rise / cardScale}px)`,
                opacity: enter,
              }}
            >
              {children}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
