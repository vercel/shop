import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { fadeIn } from "../lib/helpers";
import { CursorIcon, IconCart } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * Frame-driven port of apps/docs/.../cart-demo.tsx. The original phases
 * (cursor-enter 650ms → on-button 400ms → press 200ms → updated) become
 * fixed frame marks at 30fps.
 */
const T = {
  cursorIn: 25,
  moveStart: 32,
  moveEnd: 52,
  pressStart: 60,
  pressEnd: 66,
  updated: 68,
};

export const CART_DURATION = 210;

const products = [
  { name: "Running", price: "$95", image: "sneakers/sneaker-1.png" },
  { name: "Sport", price: "$88", image: "sneakers/sneaker-4.png" },
  { name: "Classic", price: "$62", image: "sneakers/sneaker-2.png" },
];

export const CartComposition = ({
  kicker = "Vercel Shop · Template",
  title = "A server-driven cart that feels instant",
  layout = "split",
}: {
  kicker?: string;
  title?: string;
  layout?: StageLayout;
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);

  const isPressing = frame >= T.pressStart && frame < T.pressEnd;
  const isUpdated = frame >= T.updated;
  const showCursor = frame >= T.cursorIn && frame < T.updated + 4;

  const move = interpolate(frame, [T.moveStart, T.moveEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const cursorTop = interpolate(move, [0, 1], [200, 70]);
  const cursorRight = interpolate(move, [0, 1], [20, 32]);
  const cursorScale = isPressing ? 0.75 : 1;

  const badgeScale = spring({
    frame: frame - T.updated,
    fps,
    config: { damping: 14, stiffness: 240 },
    durationInFrames: 14,
  });

  return (
    <Stage kicker={kicker} layout={layout} title={title} width={620}>
      <div className="overflow-hidden rounded-xl border border-gray-alpha-400 bg-background-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-alpha-400 px-5 py-3.5">
          <span className="text-xs font-medium text-gray-700">Shop</span>
          <div className="relative">
            <IconCart className="text-foreground" size={16} />
            {isUpdated && (
              <span
                className="absolute -right-2 -top-2 flex size-3.5 items-center justify-center rounded-full bg-red-800 text-[9px] font-medium text-white"
                style={{ transform: `scale(${badgeScale})` }}
              >
                1
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-row bg-background-200">
          {/* Products */}
          <div className="relative flex flex-[2] flex-col gap-1 border-r border-gray-alpha-400 p-5">
            <span className="mb-2 text-xs font-medium text-gray-700">Products</span>
            {products.map((product, i) => {
              const isFirst = i === 0;
              const isLast = i === products.length - 1;
              return (
                <div
                  className={`relative flex items-center gap-4 rounded px-2 ${
                    isFirst ? "border border-gray-alpha-400 bg-background-100" : ""
                  } ${!isFirst && !isLast ? "border-b border-gray-200" : ""}`}
                  key={product.name}
                >
                  <div className="relative size-14 shrink-0">
                    <Img className="absolute inset-0 h-full w-full object-contain" src={staticFile(product.image)} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-foreground">{product.name}</span>
                    <span className="text-xs text-gray-600">{product.price}</span>
                  </div>
                  <button
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-alpha-400 bg-background-200 px-3 py-2 text-xs font-medium text-gray-800"
                    style={{ transform: `scale(${isFirst && isPressing ? 0.95 : 1})` }}
                    type="button"
                  >
                    <IconCart size={12} />
                    Add
                  </button>
                  {isLast && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background-200 to-transparent"
                    />
                  )}
                </div>
              );
            })}

            {/* Animated cursor */}
            {showCursor && (
              <div
                className="pointer-events-none absolute z-10 drop-shadow-md"
                style={{ top: cursorTop, right: cursorRight, opacity: fadeIn(frame, T.cursorIn, 5) }}
              >
                <CursorIcon
                  className="size-6 text-foreground"
                  style={{ transform: `scale(${cursorScale})` }}
                />
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex min-h-[170px] w-[34%] flex-col p-5">
            <span className="mb-4 text-xs font-medium text-gray-700">Cart</span>
            {isUpdated ? (
              <div className="flex flex-col gap-4" style={{ opacity: fadeIn(frame, T.updated, 5) }}>
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded border border-gray-alpha-400 bg-background-100">
                    <Img
                      className="absolute inset-0 h-full w-full object-contain p-1"
                      src={staticFile("sneakers/sneaker-1.png")}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground">Running</span>
                      <span className="text-xs text-gray-700">$95</span>
                    </div>
                    <span className="text-[9px] text-gray-600">Shoe</span>
                  </div>
                </div>
                <div className="border-t border-gray-alpha-400" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">$95.00</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <span className="text-xs text-gray-500">Empty</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
};
