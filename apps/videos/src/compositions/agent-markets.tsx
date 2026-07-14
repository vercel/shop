import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { BrowserChrome } from "../lib/browser-chrome";
import { caretBlink, fadeIn, riseIn, spinnerRotation, typedChars, typingDuration } from "../lib/helpers";
import { CheckIcon, IconCart, SpinnerIcon } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * Story version of the Markets skill clip:
 * 1. Claude Code-style agent: transcript streams from the top, prompt input
 *    pinned at the bottom.
 * 2. The agent asks which locales to enable (AskUserQuestion-style panel).
 * 3. The window switches to the storefront, a locale switcher pops into the
 *    header, picks de-DE, and the products localize.
 */

const COMMAND = "/vercel-shop:enable-shopify-markets";
const INTRO = "I'll enable Shopify Markets. One question first:";
const QUESTION = "Which locales should I enable?";
const OPTION_1 = "de-DE, fr-FR, es-ES, nl-NL (Recommended)";
const OPTION_2 = "Let me choose manually";
const LOCALES = ["en-US", "de-DE", "fr-FR", "es-ES", "nl-NL"];

const LOGS = [
  { icon: "edit", text: "Updated next.config.ts with i18n routing" },
  { icon: "add", text: "Added locale files: de-DE, fr-FR, es-ES, nl-NL" },
  { icon: "edit", text: "Wrapped routes with [locale] segment" },
] as const;

const FPS = 30;
const TYPE_START = 15;
const CPS = 16;

const submit = TYPE_START + typingDuration(COMMAND, FPS, CPS) + 14;
const intro = submit + 12;
const introEnd = intro + typingDuration(INTRO, FPS, 30);
const ask = introEnd + 10;
const chosen = ask + 55;
const run = chosen + 16;
const logs = [run + 30, run + 56, run + 82];
const done = logs[2]! + 30;
const cut = done + 30;
const site = cut + 6;
const pill = site + 24;
const open = pill + 26;
const highlight = open + 16;
const apply = open + 30;

export const AGENT_MARKETS_DURATION = apply + 90 + FULL_CONTENT_DELAY;

const products = [
  { image: "sneakers/sneaker-1", name: "Running", nameDe: "Laufschuh", price: "$95", priceDe: "89 €" },
  { image: "sneakers/sneaker-4", name: "Sport", nameDe: "Sport", price: "$88", priceDe: "82 €" },
  { image: "sneakers/sneaker-2", name: "Classic", nameDe: "Klassisch", price: "$62", priceDe: "58 €" },
];

const GlobeIcon = () => (
  <svg className="size-3" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/**
 * Text swap for the localization payoff. Both strings share one grid cell so
 * the container sizes to the wider of the two and nothing wraps. The old
 * value fades as the new one springs in with the same pop as the locale
 * pill's entrance, so changed fields are easy to spot.
 */
const Swap = ({ a, b, at, frame }: { a: string; b: string; at: number; frame: number }) => {
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - at,
    fps,
    config: { damping: 14, stiffness: 220 },
    durationInFrames: 16,
  });
  const started = frame >= at;
  return (
    <span className="inline-grid whitespace-nowrap">
      <span className="[grid-area:1/1]" style={{ opacity: started ? 0 : 1 }}>
        {a}
      </span>
      <span
        className="inline-block [grid-area:1/1]"
        style={{ opacity: started ? 1 : 0, transform: `scale(${started ? pop : 0})` }}
      >
        {b}
      </span>
    </span>
  );
};

const TerminalScene = ({ frame, fps }: { frame: number; fps: number }) => {
  const chars = typedChars(frame, TYPE_START, COMMAND, fps, CPS);
  const isTyping = frame >= TYPE_START && chars < COMMAND.length && frame < submit;
  const introChars = typedChars(frame, intro, INTRO, fps, 45);
  const showAsk = frame >= ask && frame < chosen;
  const showSpinner = frame >= run && frame < done;

  return (
    <div className="flex h-[320px] flex-col gap-2.5 overflow-hidden">
      {/* Transcript streams from the top */}
      {frame >= submit && (
        <div className="flex items-center gap-2 font-mono text-xs" style={riseIn(frame, submit, 5)}>
          <span className="text-gray-600">❯</span>
          <span className="text-foreground">{COMMAND}</span>
        </div>
      )}

      {frame >= intro && (
        <div className="text-xs leading-5 text-gray-1000">{INTRO.slice(0, introChars)}</div>
      )}

      {frame >= chosen && (
        <div className="flex items-center gap-2 font-mono text-xs text-green-800" style={riseIn(frame, chosen, 5)}>
          <CheckIcon />
          Locales: de-DE, fr-FR, es-ES, nl-NL
        </div>
      )}

      {/* Skill run */}
      {showSpinner && (
        <div style={{ opacity: fadeIn(frame, run, 5) }}>
          <span className="inline-flex items-center gap-2 text-xs text-gray-1000">
            <SpinnerIcon rotation={spinnerRotation(frame, fps)} />
            Running skill…
          </span>
        </div>
      )}
      {LOGS.map((log, i) => {
        const start = logs[i]!;
        if (frame < start) return null;
        return (
          <div className="flex items-start gap-2 font-mono text-xs" key={log.text} style={riseIn(frame, start)}>
            <span
              className={`inline-flex size-3.5 shrink-0 items-center justify-center text-sm leading-none ${
                log.icon === "add" ? "text-green-800" : "text-amber-800"
              }`}
            >
              {log.icon === "add" ? "+" : "~"}
            </span>
            <span className="text-foreground/50">{log.text}</span>
          </div>
        );
      })}
      {frame >= done && (
        <div className="flex items-center gap-2 font-mono text-xs text-green-800" style={riseIn(frame, done)}>
          <CheckIcon />
          Shopify Markets enabled — 4 locales configured
        </div>
      )}

      {/* Bottom slot, Claude Code style: the AskUserQuestion panel takes the
          place of the prompt input while a question is pending. */}
      <div className="mt-auto flex flex-col gap-1">
        {showAsk ? (
          <div
            className="flex flex-col gap-1.5 rounded-lg border border-gray-alpha-400 bg-background-200 p-3"
            style={riseIn(frame, ask, 8)}
          >
            <span className="text-xs font-medium text-foreground">{QUESTION}</span>
            <div className="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-foreground">
              <span className="text-gray-600">❯</span> 1. {OPTION_1}
            </div>
            <div className="px-2 py-1 font-mono text-xs text-gray-700">
              <span className="mr-2 opacity-0">❯</span>2. {OPTION_2}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-alpha-400 bg-background-100 px-3 py-2.5">
            <span className="font-mono text-xs text-gray-600">❯</span>
            <span className="font-mono text-xs text-foreground">
              {frame < submit ? COMMAND.slice(0, chars) : ""}
              {frame >= submit && <span className="text-gray-500">Ask anything…</span>}
              <span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-[5px] bg-foreground/70 align-middle"
                style={{ opacity: isTyping ? caretBlink(frame, fps) : 0 }}
              />
            </span>
          </div>
        )}
        <span className="self-end font-mono text-[9px] text-gray-500">
          {showAsk ? "↵ to select" : "↵ to run"}
        </span>
      </div>
    </div>
  );
};

const SiteScene = ({ frame, fps, theme }: { frame: number; fps: number; theme: "light" | "dark" }) => {
  const pillIn = spring({
    frame: frame - pill,
    fps,
    config: { damping: 14, stiffness: 220 },
    durationInFrames: 16,
  });
  const dropdownOpen = frame >= open && frame < apply;
  const applied = frame >= apply;

  return (
    <div
      className="flex h-[320px] flex-col overflow-hidden"
      style={{ opacity: fadeIn(frame, site, 8), transform: `scale(${0.98 + fadeIn(frame, site, 10) * 0.02})` }}
    >
      {/* Storefront header — fixed height so the pill popping in doesn't
          push the layout around */}
      <div className="relative flex h-11 items-center justify-between border-b border-gray-alpha-400 px-1 pb-1.5">
        <span className="text-xs font-medium text-gray-700">Shop</span>
        <div className="flex items-center gap-3">
          {/* The new element the skill added */}
          {frame >= pill && (
            <span
              className="flex items-center gap-1.5 rounded-full border border-gray-alpha-400 bg-background-100 px-2.5 py-1 text-xs text-foreground"
              style={{ transform: `scale(${pillIn})` }}
            >
              <GlobeIcon />
              <Swap a="en-US" at={apply} b="de-DE" frame={frame} />
              <svg className="size-2.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          )}
          <IconCart className="text-foreground" size={16} />
        </div>

        {/* Locale dropdown */}
        {dropdownOpen && (
          <div
            className="absolute right-8 top-9 z-10 flex w-28 flex-col rounded-lg border border-gray-alpha-400 bg-background-100 py-1 shadow-lg"
            style={riseIn(frame, open, 6)}
          >
            {LOCALES.map((locale) => (
              <span
                className={`px-2.5 py-1 font-mono text-[10px] ${
                  locale === "de-DE" && frame >= highlight
                    ? "bg-gray-100 text-foreground"
                    : locale === "en-US"
                      ? "text-foreground"
                      : "text-gray-700"
                }`}
                key={locale}
              >
                {locale}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product grid — fields localize with a staggered diff-flash */}
      <div className="grid flex-1 grid-cols-3 gap-3 pt-4">
        {products.map((product, i) => (
          <div className="flex h-fit flex-col gap-3 rounded-lg border border-gray-300 p-3" key={product.image}>
            <div className="relative h-24 w-full overflow-hidden">
              <Img
                className="absolute inset-0 h-full w-full object-contain"
                src={staticFile(`${product.image}${theme === "dark" ? "-dark" : ""}.png`)}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground">
                <Swap a={product.name} at={apply + 6 + i * 5} b={product.nameDe} frame={frame} />
              </span>
              <span className="text-gray-800">
                <Swap a={product.price} at={apply + 9 + i * 5} b={product.priceDe} frame={frame} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Localized URL hint */}
      <div className="flex items-center gap-1.5 pt-3 font-mono text-[10px] text-gray-600">
        <Swap
          a="vercel.shop/en-US"
          at={apply + 26}
          b="vercel.shop/de-DE"
          frame={frame}
        />
      </div>
    </div>
  );
};

export const AgentMarketsComposition = ({
  kicker = "Vercel Shop · Agent Skills",
  title = "Go multi-region in one command",
  layout = "split",
  theme = "dark",
}: {
  kicker?: string;
  title?: string;
  layout?: StageLayout;
  theme?: "light" | "dark";
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);

  const inTerminal = frame < cut + 6;
  const terminalOpacity = 1 - fadeIn(frame, cut, 6);

  return (
    <Stage
      kicker={kicker}
      layout={layout}
      scale={layout === "full" ? 2.45 : 1.7}
      theme={theme}
      title={title}
      width={620}
    >
      {inTerminal ? (
        <div style={{ opacity: terminalOpacity }}>
          <BrowserChrome showLockIcon={false} url="Coding Agent">
            <TerminalScene fps={fps} frame={frame} />
          </BrowserChrome>
        </div>
      ) : (
        <BrowserChrome showLockIcon url="vercel.shop">
          <SiteScene fps={fps} frame={frame} theme={theme} />
        </BrowserChrome>
      )}
    </Stage>
  );
};
