import {
  AbsoluteFill,
  interpolate,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { StageLayout } from "../lib/stage";
import { AgentComposition, agentDuration, agentSkills } from "./agent";
import { AssistantComposition, ASSISTANT_DURATION } from "./assistant";
import { CartComposition, CART_DURATION } from "./cart";
import { CONTENT_NEGOTIATION_DURATION, ContentNegotiationComposition } from "./content-negotiation";

/*
 * Blog-post hero: title card → agent skill → cart → content negotiation →
 * assistant → end card. Copy defaults come from apps/docs/lib/site.ts.
 */

const TITLE_CARD = 105;
const END_CARD = 90;

export const SHOWREEL_DURATION =
  TITLE_CARD +
  agentDuration(agentSkills.markets!) +
  CART_DURATION +
  CONTENT_NEGOTIATION_DURATION +
  ASSISTANT_DURATION +
  END_CARD;

const Card = ({
  kicker,
  headline,
  sub,
}: {
  kicker?: string;
  headline: string;
  sub?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-background-200 font-sans antialiased">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(80% 60% at 50% 0%, oklch(1 0 0 / 0.9), transparent)" }}
      />
      <div
        className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-32 text-center"
        style={{
          opacity: enter * exit,
          transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
        }}
      >
        {kicker && (
          <span className="font-mono text-[20px] uppercase tracking-[0.16em] text-gray-800">
            {kicker}
          </span>
        )}
        <h1 className="max-w-[1100px] text-[72px] font-normal leading-[1.1] tracking-[-0.03em] text-foreground">
          {headline}
        </h1>
        {sub && <p className="max-w-[820px] text-[28px] leading-normal text-gray-900">{sub}</p>}
      </div>
    </AbsoluteFill>
  );
};

export const ShowreelComposition = ({
  headline = "Production-ready Shopify storefront on Next.js",
  subtitle = "Commerce for the agentic era. Fast by default and built to be customized.",
  url = "vercel-shop.labs.vercel.dev",
  layout = "split",
}: {
  headline?: string;
  subtitle?: string;
  url?: string;
  layout?: StageLayout;
}) => (
  <Series>
    <Series.Sequence durationInFrames={TITLE_CARD}>
      <Card headline={headline} kicker="Vercel Shop" sub={subtitle} />
    </Series.Sequence>
    <Series.Sequence durationInFrames={agentDuration(agentSkills.markets!)}>
      <AgentComposition layout={layout} skillKey="markets" />
    </Series.Sequence>
    <Series.Sequence durationInFrames={CART_DURATION}>
      <CartComposition layout={layout} />
    </Series.Sequence>
    <Series.Sequence durationInFrames={CONTENT_NEGOTIATION_DURATION}>
      <ContentNegotiationComposition layout={layout} />
    </Series.Sequence>
    <Series.Sequence durationInFrames={ASSISTANT_DURATION}>
      <AssistantComposition layout={layout} />
    </Series.Sequence>
    <Series.Sequence durationInFrames={END_CARD}>
      <Card headline="Start with the template" sub={url} />
    </Series.Sequence>
  </Series>
);
