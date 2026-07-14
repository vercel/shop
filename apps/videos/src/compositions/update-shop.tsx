import { useCurrentFrame, useVideoConfig } from "remotion";

import { BrowserChrome } from "../lib/browser-chrome";
import { caretBlink, fadeIn, riseIn, spinnerRotation, typedChars, typingDuration } from "../lib/helpers";
import { CheckIcon, SpinnerIcon } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * Story version of the update-shop skill clip. Stays in the terminal the
 * whole time — the payoff is the reasoning, not a UI change:
 * 1. Audit: the agent reads the scaffold metadata and the rollout log.
 * 2. One entry is skipped because the shop already adopted it — the beat
 *    that shows change-level reasoning instead of version diffing.
 * 3. Plan: an AskUserQuestion-style panel lists the applicable changes.
 * 4. Apply: log lines per change, decisions recorded in rollout-state.json.
 */

const COMMAND = "/vercel-shop:update-shop";
const AUDIT_LINE = "Scaffolded May 14 · 4 template changes since";
const SKIP_LINE = "Content negotiation — already adopted, skipping";
const INTRO = "Here's the upgrade plan. One question first:";
const QUESTION = "Apply these 3 changes?";
const PLAN = [
  "Variant picker tiers",
  "Heading weight standardization",
  "Cart cookie SameSite fix",
];
const OPTION_1 = "Apply all 3 (Recommended)";
const OPTION_2 = "Let me choose";

const LOGS = [
  { icon: "edit", text: "Updated variant picker with outlined tiers" },
  { icon: "edit", text: "Standardized heading weight to 400" },
  { icon: "edit", text: "Relaxed cart cookie to SameSite=Lax off production" },
  { icon: "add", text: "Recorded decisions in .vercel-shop/rollout-state.json" },
] as const;

/* One real diff excerpt under the cookie change — enough to show actual
   edits landed without turning the clip into an editor tour. */
const DIFF_OLD = '-   sameSite: "strict",';
const DIFF_NEW = '+   sameSite: isProd ? "strict" : "lax",';

const FPS = 30;
const TYPE_START = 15;
const CPS = 16;

const submit = TYPE_START + typingDuration(COMMAND, FPS, CPS) + 14;
const audit = submit + 10;
const auditLine = audit + 28;
const skipLine = auditLine + 22;
const intro = skipLine + 18;
const introEnd = intro + typingDuration(INTRO, FPS, 45);
const ask = introEnd + 10;
const chosen = ask + 60;
const run = chosen + 14;
const logs = [run + 26, run + 48, run + 70, run + 112];
const diff = logs[2]! + 16;
const done = logs[3]! + 28;

export const UPDATE_SHOP_DURATION = done + 90 + FULL_CONTENT_DELAY;

const TerminalScene = ({ frame, fps }: { frame: number; fps: number }) => {
  const chars = typedChars(frame, TYPE_START, COMMAND, fps, CPS);
  const isTyping = frame >= TYPE_START && chars < COMMAND.length && frame < submit;
  const introChars = typedChars(frame, intro, INTRO, fps, 45);
  const showAsk = frame >= ask && frame < chosen;
  const showAuditSpinner = frame >= audit && frame < auditLine;
  const showRunSpinner = frame >= run && frame < done;

  return (
    <div className="flex h-[400px] flex-col gap-2.5 overflow-hidden">
      {/* Transcript streams from the top */}
      {frame >= submit && (
        <div className="flex items-center gap-2 font-mono text-xs" style={riseIn(frame, submit, 5)}>
          <span className="text-gray-600">❯</span>
          <span className="text-foreground">{COMMAND}</span>
        </div>
      )}

      {/* Audit */}
      {showAuditSpinner && (
        <div style={{ opacity: fadeIn(frame, audit, 5) }}>
          <span className="inline-flex items-center gap-2 text-xs text-gray-1000">
            <SpinnerIcon rotation={spinnerRotation(frame, fps)} />
            Auditing drift…
          </span>
        </div>
      )}
      {frame >= auditLine && (
        <div className="flex items-center gap-2 font-mono text-xs text-gray-1000" style={riseIn(frame, auditLine, 5)}>
          <CheckIcon />
          {AUDIT_LINE}
        </div>
      )}
      {/* The change-level reasoning beat: an entry the shop already has */}
      {frame >= skipLine && (
        <div className="flex items-start gap-2 font-mono text-xs" style={riseIn(frame, skipLine, 5)}>
          <span className="inline-flex size-3.5 shrink-0 items-center justify-center text-sm leading-none text-gray-600">
            −
          </span>
          <span className="text-gray-700">{SKIP_LINE}</span>
        </div>
      )}

      {frame >= intro && (
        <div className="text-xs leading-5 text-gray-1000">{INTRO.slice(0, introChars)}</div>
      )}

      {frame >= chosen && (
        <div className="flex items-center gap-2 font-mono text-xs text-green-800" style={riseIn(frame, chosen, 5)}>
          <CheckIcon />
          Apply all 3 changes
        </div>
      )}

      {/* Skill run */}
      {showRunSpinner && (
        <div style={{ opacity: fadeIn(frame, run, 5) }}>
          <span className="inline-flex items-center gap-2 text-xs text-gray-1000">
            <SpinnerIcon rotation={spinnerRotation(frame, fps)} />
            Applying changes…
          </span>
        </div>
      )}
      {LOGS.map((log, i) => {
        const start = logs[i]!;
        if (frame < start) return null;
        return (
          <div className="contents" key={log.text}>
            <div className="flex items-start gap-2 font-mono text-xs" style={riseIn(frame, start)}>
              <span
                className={`inline-flex size-3.5 shrink-0 items-center justify-center text-sm leading-none ${
                  log.icon === "add" ? "text-green-800" : "text-amber-800"
                }`}
              >
                {log.icon === "add" ? "+" : "~"}
              </span>
              <span className="text-foreground/50">{log.text}</span>
            </div>
            {/* Diff excerpt slots in under the cookie change */}
            {i === 2 && frame >= diff && (
              <div
                className="flex flex-col gap-1 pl-[22px] font-mono text-[10px] leading-[14px]"
                style={riseIn(frame, diff, 6)}
              >
                <span className="text-red-800">{DIFF_OLD}</span>
                <span className="text-green-800">{DIFF_NEW}</span>
              </div>
            )}
          </div>
        );
      })}
      {frame >= done && (
        <div className="flex items-center gap-2 font-mono text-xs text-green-800" style={riseIn(frame, done)}>
          <CheckIcon />
          Shop up to date — 3 adopted · 7 files changed, +64 −31
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
            <div className="flex flex-col gap-0.5 px-2">
              {PLAN.map((change) => (
                <span className="flex items-center gap-2 font-mono text-[10px] text-gray-800" key={change}>
                  <span className="text-green-800">+</span>
                  {change}
                </span>
              ))}
            </div>
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

export const UpdateShopComposition = ({
  kicker = "Vercel Shop · Agent Skills",
  title = "Adopt template updates in one command",
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

  return (
    <Stage
      kicker={kicker}
      layout={layout}
      scale={layout === "full" ? 2.2 : 1.7}
      theme={theme}
      title={title}
      width={620}
    >
      <BrowserChrome showLockIcon={false} url="Coding Agent">
        <TerminalScene fps={fps} frame={frame} />
      </BrowserChrome>
    </Stage>
  );
};
