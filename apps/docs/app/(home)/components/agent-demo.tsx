"use client";

import { useEffect, useRef, useState } from "react";

type Phase =
	| "idle"
	| "typing-command"
	| "running"
	| "log-1"
	| "log-2"
	| "log-3"
	| "done";

const command = "/enable-shopify-markets";

const logs = [
	{ icon: "edit", text: "Updated next.config.ts with i18n routing" },
	{ icon: "add", text: "Added locale files: de-DE, fr-FR, es-ES, nl-NL" },
	{ icon: "edit", text: "Wrapped routes with [locale] segment" },
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
				className={
					icon === "add"
						? "shrink-0 text-green-400"
						: "shrink-0 text-yellow-400"
				}
			>
				{icon === "add" ? "+" : "~"}
			</span>
			<span className="text-fd-muted-foreground">{text}</span>
		</div>
	);
};

const Spinner = () => (
	<span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
		<svg
			className="size-3 animate-spin"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			viewBox="0 0 24 24"
		>
			<path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
		</svg>
		Running skill…
	</span>
);

export const AgentDemo = () => {
	const [phase, setPhase] = useState<Phase>("idle");
	const [charIndex, setCharIndex] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const hasStarted = useRef(false);

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
		if (charIndex >= command.length) {
			setTimeout(() => setPhase("running"), 600);
			return;
		}
		const timeout = setTimeout(
			() => setCharIndex((i) => i + 1),
			40 + Math.random() * 50,
		);
		return () => clearTimeout(timeout);
	}, [phase, charIndex]);

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

	const phaseIndex = [
		"idle",
		"typing-command",
		"running",
		"log-1",
		"log-2",
		"log-3",
		"done",
	].indexOf(phase);

	const showCommand = phaseIndex >= 1;
	const showSpinner = phaseIndex >= 2 && phaseIndex < 6;
	const showDone = phaseIndex >= 6;

	return (
		<div
			ref={ref}
			className="flex h-64 flex-col overflow-hidden rounded-xl border bg-[#0a0a0a] sm:h-72"
		>
			{/* Terminal title bar */}
			<div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
				<div className="flex gap-1.5">
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
				</div>
				<span className="mx-auto font-mono text-[11px] text-white/40">
					coding agent
				</span>
			</div>

			{/* Terminal body */}
			<div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-4">
				{/* Command input */}
				{showCommand && (
					<div className="flex items-center gap-2 animate-[fade-in_0.15s_ease]">
						<span className="font-mono text-xs text-orange-400">
							&gt;
						</span>
						<span className="font-mono text-xs text-white">
							{phase === "typing-command"
								? command.slice(0, charIndex)
								: command}
							{phase === "typing-command" && (
								<span className="ml-0.5 inline-block h-3.5 w-[5px] animate-[pulse_0.6s_ease-in-out_infinite] bg-white/70" />
							)}
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
				<div className="flex flex-col gap-1.5">
					{logs.map((log, i) => (
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
					<div className="flex items-center gap-2 font-mono text-xs text-green-400 animate-[fade-in_0.3s_ease]">
						<svg
							className="size-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24"
						>
							<path d="M20 6 9 17l-5-5" />
						</svg>
						Shopify Markets enabled — 4 locales configured
					</div>
				)}

				{/* Prompt input at bottom */}
				<div className="mt-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
					<span className="font-mono text-xs text-white/30">
						Ask a question...
					</span>
				</div>
			</div>
		</div>
	);
};
