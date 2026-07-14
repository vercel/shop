import { useCurrentFrame, useVideoConfig } from "remotion";

import { BrowserChrome } from "../lib/browser-chrome";
import { caretBlink, fadeIn, riseIn, spinnerRotation, typedChars, typingDuration } from "../lib/helpers";
import { CheckIcon, SpinnerIcon } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * Frame-driven port of apps/docs/.../agent-demo.tsx, one skill per clip
 * instead of the tabbed switcher. The setTimeout chain (type → 600ms →
 * spinner 1000ms → logs at 800ms → done) becomes frame offsets from the
 * end of typing.
 */

export interface AgentSkill {
  key: string;
  command: string;
  logs: { icon: "add" | "edit"; text: string }[];
  done: string;
  title: string;
}

export const agentSkills: Record<string, AgentSkill> = {
  markets: {
    key: "markets",
    command: "/vercel-shop:enable-shopify-markets",
    logs: [
      { icon: "edit", text: "Updated next.config.ts with i18n routing" },
      { icon: "add", text: "Added locale files: de-DE, fr-FR, es-ES, nl-NL" },
      { icon: "edit", text: "Wrapped routes with [locale] segment" },
    ],
    done: "Shopify Markets enabled — 4 locales configured",
    title: "Go multi-region in one command",
  },
  auth: {
    key: "auth",
    command: "/vercel-shop:enable-shopify-auth",
    logs: [
      { icon: "add", text: "Installed better-auth with Shopify OIDC" },
      { icon: "add", text: "Created account pages: profile, orders, addresses" },
      { icon: "edit", text: "Added login button to navigation" },
    ],
    done: "Customer auth enabled — login flow ready",
    title: "Customer accounts in one command",
  },
  cms: {
    key: "cms",
    command: "/vercel-shop:enable-shopify-cms",
    logs: [
      { icon: "add", text: "Created cms_homepage metaobject definition" },
      { icon: "add", text: "Added GraphQL queries for metaobjects" },
      { icon: "edit", text: "Wired MarketingPageRenderer to CMS data" },
    ],
    done: "Shopify CMS enabled — homepage connected",
    title: "Use Shopify as your CMS in one command",
  },
};

const FPS = 30;
const CPS = 18;
const PROMPT_START = 20;

const marks = (skill: AgentSkill) => {
  const typeEnd = PROMPT_START + typingDuration(skill.command, FPS, CPS);
  const spinner = typeEnd + 15;
  const log1 = spinner + 28;
  const log2 = log1 + 22;
  const log3 = log2 + 22;
  const done = log3 + 28;
  return { typeEnd, spinner, logs: [log1, log2, log3], done };
};

export const agentDuration = (skill: AgentSkill) => marks(skill).done + 75;

export const AgentComposition = ({
  skillKey = "markets",
  kicker = "Vercel Shop · Agent Skills",
  title,
  layout = "split",
  theme = "light",
}: {
  skillKey?: string;
  kicker?: string;
  title?: string;
  layout?: StageLayout;
  theme?: "light" | "dark";
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);
  const skill = agentSkills[skillKey] ?? agentSkills.markets!;
  const m = marks(skill);

  const chars = typedChars(frame, PROMPT_START, skill.command, fps, CPS);
  const isTyping = frame >= PROMPT_START && chars < skill.command.length;
  const showSpinner = frame >= m.spinner && frame < m.done;
  const showDone = frame >= m.done;

  return (
    <Stage kicker={kicker} layout={layout} theme={theme} title={title ?? skill.title} width={620}>
      <BrowserChrome showLockIcon={false} url="Coding Agent">
        <div className="flex h-44 flex-col gap-2.5 overflow-hidden">
          {/* Command input */}
          {frame >= PROMPT_START && (
            <div className="flex h-5 items-center gap-2" style={{ opacity: fadeIn(frame, PROMPT_START, 4) }}>
              <span className="inline-flex size-3.5 shrink-0 items-center justify-center font-mono text-xs leading-none text-amber-800">
                $
              </span>
              <span className="font-mono text-xs leading-5 text-foreground">
                {skill.command.slice(0, chars)}
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-3.5 w-[5px] bg-foreground/70 align-middle"
                  style={{ opacity: isTyping ? caretBlink(frame, fps) : 0 }}
                />
              </span>
            </div>
          )}

          {/* Spinner */}
          {showSpinner && (
            <div style={{ opacity: fadeIn(frame, m.spinner, 5) }}>
              <span className="inline-flex items-center gap-2 text-xs text-gray-1000">
                <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
                  <SpinnerIcon rotation={spinnerRotation(frame, fps)} />
                </span>
                Running skill…
              </span>
            </div>
          )}

          {/* Log lines */}
          <div className="flex flex-col gap-2.5">
            {skill.logs.map((log, i) => {
              const start = m.logs[i]!;
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
          </div>

          {/* Done */}
          {showDone && (
            <div className="flex items-center gap-2 font-mono text-xs text-green-800" style={riseIn(frame, m.done)}>
              <CheckIcon />
              {skill.done}
            </div>
          )}
        </div>
      </BrowserChrome>
    </Stage>
  );
};
