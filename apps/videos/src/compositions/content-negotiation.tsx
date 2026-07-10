import { useCurrentFrame, useVideoConfig } from "remotion";

import { BrowserChrome } from "../lib/browser-chrome";
import { caretBlink, fadeIn, spinnerRotation, typedChars, typingDuration } from "../lib/helpers";
import { SpinnerIcon } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/* Frame-driven port of apps/docs/.../content-negotiation-demo.tsx. */

const CURL_COMMAND =
  'curl -H "Accept: text/markdown" https://vercel-shop.labs.vercel.dev/en-US/products/classic-tee';

const MARKDOWN_RESPONSE = `# Classic Tee

**$29.00** ~~$35.00~~  · In Stock

A premium cotton t-shirt with a relaxed fit.

## Variants

| Color | Size | Available |
|-------|------|-----------|
| Black | S    | ✓         |
| Black | M    | ✓         |
| Black | L    | ✓         |
| White | S    | ✓         |
| White | M    | ✗         |

## Specs

- **Material:** 100% organic cotton
- **Weight:** 180gsm
- **Origin:** Portugal`;

const lines = MARKDOWN_RESPONSE.split("\n");

const FPS = 30;
const CPS = 35;
const PROMPT_START = 20;
const LINE_EVERY = 1.2;

const typeEnd = PROMPT_START + typingDuration(CURL_COMMAND, FPS, CPS);
const loadingStart = typeEnd + 12;
const responseStart = loadingStart + 24;
const responseEnd = responseStart + Math.ceil(lines.length * LINE_EVERY);

export const CONTENT_NEGOTIATION_DURATION = responseEnd + 90;

export const ContentNegotiationComposition = ({
  kicker = "Vercel Shop · Agent-Native",
  title = "The same URL speaks Markdown to agents",
  layout = "split",
}: {
  kicker?: string;
  title?: string;
  layout?: StageLayout;
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);

  const chars = typedChars(frame, PROMPT_START, CURL_COMMAND, fps, CPS);
  const isTyping = frame >= PROMPT_START && chars < CURL_COMMAND.length;
  const showLoading = frame >= loadingStart && frame < responseStart;
  const visibleLines = frame >= responseStart ? Math.floor((frame - responseStart) / LINE_EVERY) : 0;

  return (
    <Stage
      kicker={kicker}
      layout={layout}
      scale={layout === "split" ? 1.5 : 1.7}
      title={title}
      width={640}
    >
      <BrowserChrome showLockIcon={false} url="Terminal">
        <div className="flex h-[480px] flex-col gap-1 overflow-hidden">
          {frame >= PROMPT_START && (
            <div className="flex items-start gap-2" style={{ opacity: fadeIn(frame, PROMPT_START, 4) }}>
              <span className="font-mono text-xs leading-5 text-gray-1000">$</span>
              <span className="break-all font-mono text-xs leading-5 text-gray-1000">
                {CURL_COMMAND.slice(0, chars)}
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-3.5 w-[5px] bg-black/70 align-middle"
                  style={{ opacity: isTyping ? caretBlink(frame, fps) : 0 }}
                />
              </span>
            </div>
          )}

          {showLoading && (
            <div className="mt-1" style={{ opacity: fadeIn(frame, loadingStart, 5) }}>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-1000">
                <SpinnerIcon rotation={spinnerRotation(frame, fps)} />
                Fetching…
              </span>
            </div>
          )}

          {frame >= responseStart && (
            <div className="mt-2 flex flex-col" style={{ opacity: fadeIn(frame, responseStart, 5) }}>
              {lines.slice(0, visibleLines).map((line, i) => (
                <span
                  className={`font-mono text-xs leading-relaxed text-gray-700 ${
                    line.startsWith("# ")
                      ? "text-sm font-bold"
                      : line.startsWith("## ")
                        ? "mt-1 font-semibold"
                        : ""
                  }`}
                  key={i}
                >
                  {line || " "}
                </span>
              ))}
            </div>
          )}
        </div>
      </BrowserChrome>
    </Stage>
  );
};
