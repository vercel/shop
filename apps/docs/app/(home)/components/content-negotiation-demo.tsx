"use client";

import { useEffect, useRef, useState } from "react";

const CURL_COMMAND = 'curl -H "Accept: text/markdown" https://vercel-shop.labs.vercel.dev/en-US/products/classic-tee';

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

export const ContentNegotiationDemo = () => {
	const [phase, setPhase] = useState<"idle" | "typing" | "loading" | "response">("idle");
	const [charIndex, setCharIndex] = useState(0);
	const [responseLines, setResponseLines] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const hasStarted = useRef(false);

	const lines = MARKDOWN_RESPONSE.split("\n");

	useEffect(() => {
		if (hasStarted.current) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting && !hasStarted.current) {
					hasStarted.current = true;
					observer.disconnect();
					setTimeout(() => setPhase("typing"), 500);
				}
			},
			{ threshold: 0.5 },
		);
		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (phase !== "typing") return;
		if (charIndex >= CURL_COMMAND.length) {
			setTimeout(() => setPhase("loading"), 400);
			return;
		}
		const timeout = setTimeout(
			() => setCharIndex((i) => i + 1),
			20 + Math.random() * 30,
		);
		return () => clearTimeout(timeout);
	}, [phase, charIndex]);

	useEffect(() => {
		if (phase !== "loading") return;
		const t = setTimeout(() => setPhase("response"), 800);
		return () => clearTimeout(t);
	}, [phase]);

	useEffect(() => {
		if (phase !== "response") return;
		if (responseLines >= lines.length) return;
		const t = setTimeout(
			() => setResponseLines((n) => n + 1),
			30 + Math.random() * 20,
		);
		return () => clearTimeout(t);
	}, [phase, responseLines, lines.length]);

	return (
		<div
			ref={ref}
			className="flex h-80 flex-col overflow-hidden rounded-xl border bg-white dark:bg-[#0a0a0a] sm:h-96"
		>
			<div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 px-4 py-2">
				<div className="flex gap-1.5">
					<div className="size-2.5 rounded-full bg-black/20 dark:bg-white/20" />
					<div className="size-2.5 rounded-full bg-black/20 dark:bg-white/20" />
					<div className="size-2.5 rounded-full bg-black/20 dark:bg-white/20" />
				</div>
				<span className="mx-auto font-mono text-[11px] text-black/40 dark:text-white/40">
					terminal
				</span>
			</div>

			<div className="flex flex-1 flex-col gap-1 overflow-hidden p-4">
				{phase !== "idle" && (
					<div className="flex items-start gap-2 animate-[fade-in_0.15s_ease]">
						<span className="font-mono text-xs text-green-600 dark:text-green-400">$</span>
						<span className="font-mono text-xs text-black dark:text-white break-all">
							{phase === "typing"
								? CURL_COMMAND.slice(0, charIndex)
								: CURL_COMMAND}
							{phase === "typing" && (
								<span className="ml-0.5 inline-block h-3.5 w-[5px] animate-[pulse_0.6s_ease-in-out_infinite] bg-black/70 dark:bg-white/70" />
							)}
						</span>
					</div>
				)}

				{phase === "loading" && (
					<div className="mt-1 animate-[fade-in_0.2s_ease]">
						<span className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
							<svg
								className="size-3 animate-spin"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
							</svg>
							Fetching…
						</span>
					</div>
				)}

				{phase === "response" && (
					<div className="mt-2 flex flex-col gap-0 overflow-y-auto animate-[fade-in_0.2s_ease]">
						{lines.slice(0, responseLines).map((line, i) => (
							<span
								key={i}
								className={`font-mono text-xs leading-relaxed ${
									line.startsWith("# ")
										? "text-black dark:text-white font-bold text-sm"
										: line.startsWith("## ")
											? "text-black/90 dark:text-white/90 font-semibold mt-1"
											: line.startsWith("| ")
												? "text-black/40 dark:text-white/40"
												: line.startsWith("- ")
													? "text-black/50 dark:text-white/50"
													: line.startsWith("**")
														? "text-black/70 dark:text-white/70"
														: "text-black/50 dark:text-white/50"
								}`}
							>
								{line || "\u00A0"}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
