"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserChrome } from "@/components/storefront-hero/browser-chrome";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Skill {
  label: string;
  command: string;
  logs: { icon: string; text: string }[];
  done: string;
}

const skills: Skill[] = [
  {
    label: "Markets",
    command: "/vercel-shop:enable-shopify-markets",
    logs: [
      { icon: "edit", text: "Updated next.config.ts with i18n routing" },
      { icon: "add", text: "Added locale files: de-DE, fr-FR, es-ES, nl-NL" },
      { icon: "edit", text: "Wrapped routes with [locale] segment" },
    ],
    done: "Shopify Markets enabled — 4 locales configured",
  },
  {
    label: "Auth",
    command: "/vercel-shop:enable-shopify-auth",
    logs: [
      { icon: "add", text: "Installed better-auth with Shopify OIDC" },
      {
        icon: "add",
        text: "Created account pages: profile, orders, addresses",
      },
      { icon: "edit", text: "Added login button to navigation" },
    ],
    done: "Customer auth enabled — login flow ready",
  },
  {
    label: "CMS",
    command: "/vercel-shop:enable-shopify-cms",
    logs: [
      { icon: "add", text: "Created cms_homepage metaobject definition" },
      { icon: "add", text: "Added GraphQL queries for metaobjects" },
      { icon: "edit", text: "Wired MarketingPageRenderer to CMS data" },
    ],
    done: "Shopify CMS enabled — homepage connected",
  },
];

type Phase =
  | "idle"
  | "typing-command"
  | "running"
  | "log-1"
  | "log-2"
  | "log-3"
  | "done";

const phases: Phase[] = [
  "idle",
  "typing-command",
  "running",
  "log-1",
  "log-2",
  "log-3",
  "done",
];

const LogLine = ({
  icon,
  text,
  visible,
}: {
  icon: string;
  text: string;
  visible: boolean;
}) => {
  if (!visible) return null;
  return (
    <div className="flex items-start gap-2 animate-[fade-in_0.3s_ease_forwards] font-mono text-xs">
      <span
        className={`inline-flex size-3.5 shrink-0 items-center justify-center text-sm leading-none ${
          icon === "add" ? "text-green-800" : "text-amber-800"
        }`}
      >
        {icon === "add" ? "+" : "~"}
      </span>
      <span className="text-black/50 dark:text-white/50">{text}</span>
    </div>
  );
};

const Spinner = () => (
  <span className="inline-flex items-center gap-2 text-xs text-gray-1000">
    <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
      <svg
        className="size-3 animate-spin"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
      </svg>
    </span>
    Running skill…
  </span>
);

export const AgentDemo = () => {
  const [activeSkill, setActiveSkill] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [charIndex, setCharIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const skill = skills[activeSkill]!;
  const phaseIndex = phases.indexOf(phase);

  const resetAndRun = useCallback(() => {
    setCharIndex(0);
    setPhase("idle");
    setTimeout(() => setPhase("typing-command"), 300);
  }, []);

  // Intersection observer to start
  useEffect(() => {
    if (hasStarted.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          observer.disconnect();
          setTimeout(() => setPhase("typing-command"), 500);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Type the command
  useEffect(() => {
    if (phase !== "typing-command") return;
    if (charIndex >= skill.command.length) {
      setTimeout(() => setPhase("running"), 600);
      return;
    }
    const timeout = setTimeout(
      () => setCharIndex((i) => i + 1),
      40 + Math.random() * 50,
    );
    return () => clearTimeout(timeout);
  }, [phase, charIndex, skill.command.length]);

  // Sequence through log lines
  useEffect(() => {
    if (phase === "running") {
      const t = setTimeout(() => setPhase("log-1"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "log-1") {
      const t = setTimeout(() => setPhase("log-2"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "log-2") {
      const t = setTimeout(() => setPhase("log-3"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "log-3") {
      const t = setTimeout(() => setPhase("done"), 1000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const showCommand = phaseIndex >= 1;
  const showSpinner = phaseIndex >= 2 && phaseIndex < 6;
  const showDone = phaseIndex >= 6;

  return (
    <div className="flex flex-col gap-4">
      {/* Skill switcher */}
      <Tabs
        onValueChange={(value) => {
          const index = skills.findIndex((s) => s.label === value);
          if (index === -1 || index === activeSkill) return;
          setActiveSkill(index);
          resetAndRun();
        }}
        value={skill.label}
      >
        <TabsList className="relative mx-auto h-10 w-fit items-start gap-0 overflow-visible rounded-full border border-gray-400 bg-background-200 p-0">
          {skills.map((s) => {
            const isActive = s.label === skill.label;
            return (
              <TabsTrigger
                className="group relative -top-px h-10 flex-none rounded-full border-0 bg-transparent px-5 text-base text-muted-foreground first:-ml-px last:-mr-px data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                key={s.label}
                value={s.label}
              >
                {isActive && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0 rounded-full border border-gray-400 bg-background bg-clip-padding"
                    layoutId="agent-demo-tab-indicator"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                )}
                <span className="relative z-1">{s.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Terminal */}
      <BrowserChrome showLockIcon={false} url="Coding Agent">
        <div
          ref={ref}
          className="flex h-48 flex-col gap-2.5 overflow-hidden sm:h-56"
        >
          {/* Command input */}
          {showCommand && (
            <div className="flex h-5 items-center gap-2 animate-[fade-in_0.15s_ease]">
              <span className="inline-flex size-3.5 shrink-0 items-center justify-center font-mono text-xs leading-none text-amber-800">
                $
              </span>
              <span className="font-mono text-xs leading-5 text-black dark:text-white">
                {phase === "typing-command"
                  ? skill.command.slice(0, charIndex)
                  : skill.command}
                <span
                  aria-hidden
                  className={`ml-0.5 inline-block h-3.5 w-[5px] align-middle bg-black/70 dark:bg-white/70 ${
                    phase === "typing-command"
                      ? "animate-[pulse_0.6s_ease-in-out_infinite]"
                      : "invisible"
                  }`}
                />
              </span>
            </div>
          )}

          {/* Spinner */}
          {showSpinner && (
            <div className="animate-[fade-in_0.2s_ease]">
              <Spinner />
            </div>
          )}

          {/* Log lines */}
          <div className="flex flex-col gap-2.5">
            {skill.logs.map((log, i) => (
              <LogLine
                key={log.text}
                icon={log.icon}
                text={log.text}
                visible={phaseIndex >= 3 + i}
              />
            ))}
          </div>

          {/* Done */}
          {showDone && (
            <div className="flex items-center gap-2 font-mono text-xs text-green-800 animate-[fade-in_0.3s_ease]">
              <svg
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {skill.done}
            </div>
          )}

          {/* Prompt input at bottom */}
          {/* <div className="mt-auto flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2">
            <span className="font-mono text-xs text-black/30 dark:text-white/30">
              Ask a question...
            </span>
          </div> */}
        </div>
      </BrowserChrome>
    </div>
  );
};
