import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

import { BrowserChrome } from "../lib/browser-chrome";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * "One template, any storefront": the plain apparel demo wipes into the
 * Xbox-style games storefront inside the same browser window. Both layers
 * share identical geometry so the moving boundary reads as the SAME grid
 * being reskinned, not a cut between two sites. A mid-wipe still doubles
 * as the static transformation image.
 */

const WIPE_START = 35;
const WIPE_END = 100;
const HOLD = 80;

export const TRANSFORMATION_DURATION = WIPE_END + HOLD + FULL_CONTENT_DELAY;

const shirts = [
  { name: "FlowGuard Jacket", price: "$172.00", image: "transform/shirt-1.png" },
  { name: "HaloGauge Hoodie", price: "$107.00", image: "transform/shirt-2.png" },
  { name: "AxisSync Tee", price: "$47.00", image: "transform/shirt-3.png" },
  { name: "CadenceShield Long Tee", price: "$55.00", image: "transform/shirt-4.png" },
];

const games = [
  { was: "$59.99", now: "$15.99", image: "transform/game-1.png" },
  { was: "$49.99", now: "$29.99", image: "transform/game-2.png" },
  { was: "$25.00", now: "$18.75", image: "transform/game-3.png" },
  { was: "$49.99", now: "$34.99", image: "transform/game-4.png" },
];

// Horizontal card centers as a fraction of the content width, for the
// pop-as-the-boundary-passes effect. 4 equal columns.
const centers = [0.125, 0.375, 0.625, 0.875];

/** Cards swell slightly while the wipe boundary crosses them. */
const popScale = (progress: number, center: number) => {
  const bump = Math.max(0, 1 - Math.abs(progress - center) / 0.12);
  return 1 + bump * 0.05;
};

/* Both layers hardcode their ink: the stage theme's .dark class would
   otherwise flip the light layer's tokens to light-on-white. */
const Header = ({ title, dark }: { title: string; dark?: boolean }) => (
  <div className="flex items-center justify-between pb-3">
    <span className={`text-sm font-semibold ${dark ? "text-white" : "text-[#171717]"}`}>{title}</span>
    <span className={`text-[10px] ${dark ? "text-[#9a9a9f]" : "text-[#666666]"}`}>View All</span>
  </div>
);

export const TransformationComposition = ({
  kicker = "Vercel Shop · Template",
  title = "One template, any storefront",
  layout = "full",
  theme = "dark",
}: {
  kicker?: string;
  title?: string;
  layout?: StageLayout;
  theme?: "light" | "dark";
}) => {
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);

  const progress = interpolate(frame, [WIPE_START, WIPE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const edgeOpacity = progress > 0 && progress < 1 ? 1 : 0;

  return (
    <Stage
      kicker={kicker}
      layout={layout}
      scale={layout === "full" ? 2.45 : 1.7}
      theme={theme}
      title={title}
      width={620}
    >
      <BrowserChrome showLockIcon url="vercel.shop">
        {/* Bleed to the window edges so both layers own their background */}
        <div className="relative -m-4 h-[296px] overflow-hidden rounded-b-xl">
          {/* Light layer: the plain apparel storefront */}
          <div className="absolute inset-0 bg-white p-4">
            <Header title="Products" />
            <div className="grid grid-cols-4 gap-3">
              {shirts.map((shirt, i) => (
                <div
                  className="flex flex-col gap-2"
                  key={shirt.name}
                  style={{ transform: `scale(${popScale(progress, centers[i]!)})` }}
                >
                  <div className="relative h-[185px] w-full overflow-hidden rounded-lg bg-[#fafafa]">
                    <Img
                      className="absolute inset-0 h-full w-full object-contain p-2"
                      src={staticFile(shirt.image)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate text-[10px] text-[#171717]">{shirt.name}</span>
                    <span className="font-mono text-[10px] text-[#666666]">{shirt.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dark layer: the Xbox-style deals storefront, revealed by the wipe */}
          <div
            className="absolute inset-0 bg-[#17181c] p-4"
            style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
          >
            <Header dark title="Summer Deals" />
            <div className="grid grid-cols-4 gap-3">
              {games.map((game, i) => (
                <div
                  className="flex flex-col gap-2"
                  key={game.image}
                  style={{ transform: `scale(${popScale(progress, centers[i]!)})` }}
                >
                  <div className="relative h-[185px] w-full overflow-hidden rounded-lg bg-[#232429]">
                    <Img className="absolute inset-0 h-full w-full object-cover" src={staticFile(game.image)} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[10px] text-[#77777d] line-through">{game.was}</span>
                    <span className="font-mono text-[10px] font-semibold text-[#ffb900]">{game.now}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Glowing boundary edge */}
          <div
            aria-hidden
            className="absolute inset-y-0 w-px bg-white/80"
            style={{
              left: `${progress * 100}%`,
              opacity: edgeOpacity,
              boxShadow: "0 0 12px 2px oklch(1 0 0 / 0.5)",
            }}
          />
        </div>
      </BrowserChrome>
    </Stage>
  );
};
