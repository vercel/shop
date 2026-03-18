"use client";

import { useEffect, useRef, useState } from "react";

const ProductCard = ({ delay }: { delay: number }) => (
	<div
		className="flex shrink-0 flex-col gap-1.5 rounded-lg border bg-fd-background p-2 opacity-0 animate-[fade-in_0.3s_ease_forwards]"
		style={{ animationDelay: `${delay}ms` }}
	>
		<div className="flex aspect-square w-20 items-center justify-center rounded-md bg-fd-muted sm:w-24">
			<svg
				className="size-6 text-fd-muted-foreground/40"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<circle cx="8" cy="9" r="2.5" />
				<path d="M21 17l-5-5-4 4-3-3-5 5v2h17z" />
			</svg>
		</div>
		<div className="h-2 w-3/4 rounded bg-fd-muted" />
		<div className="h-2 w-1/2 rounded bg-fd-muted" />
	</div>
);

const TypingDots = () => (
	<div className="flex gap-1 px-1">
		{[0, 1, 2].map((i) => (
			<div
				key={i}
				className="size-1.5 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-fd-muted-foreground/50"
				style={{ animationDelay: `${i * 200}ms` }}
			/>
		))}
	</div>
);

type Phase = "idle" | "typing" | "thinking" | "cards" | "done";

export const AssistantDemo = () => {
	const [phase, setPhase] = useState<Phase>("idle");
	const [charIndex, setCharIndex] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const hasStarted = useRef(false);

	const query = "Find me a black sneaker under $120";

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
		if (charIndex >= query.length) {
			setTimeout(() => setPhase("thinking"), 400);
			return;
		}
		const timeout = setTimeout(
			() => setCharIndex((i) => i + 1),
			30 + Math.random() * 40,
		);
		return () => clearTimeout(timeout);
	}, [phase, charIndex, query.length]);

	useEffect(() => {
		if (phase !== "thinking") return;
		const timeout = setTimeout(() => setPhase("cards"), 1500);
		return () => clearTimeout(timeout);
	}, [phase]);

	useEffect(() => {
		if (phase !== "cards") return;
		const timeout = setTimeout(() => setPhase("done"), 2000);
		return () => clearTimeout(timeout);
	}, [phase]);

	const showUserMessage = phase !== "idle";
	const showAssistant = phase === "thinking" || phase === "cards" || phase === "done";
	const showCards = phase === "cards" || phase === "done";

	return (
		<div
			ref={ref}
			className="flex h-64 flex-col justify-end overflow-hidden rounded-xl border bg-fd-muted/30 p-4 sm:h-72"
		>
			<div className="flex flex-col gap-3">
				{/* User message */}
				{showUserMessage && (
					<div className="flex justify-end animate-[fade-in_0.2s_ease]">
						<div className="rounded-2xl rounded-br-sm bg-fd-primary px-3 py-2 text-xs text-fd-primary-foreground sm:text-sm">
							{phase === "typing"
								? query.slice(0, charIndex)
								: query}
							{phase === "typing" && (
								<span className="ml-0.5 inline-block w-0.5 animate-[pulse_0.5s_ease-in-out_infinite] bg-fd-primary-foreground">
									&nbsp;
								</span>
							)}
						</div>
					</div>
				)}

				{/* Assistant response */}
				{showAssistant && (
					<div className="flex flex-col gap-2 animate-[fade-in_0.3s_ease]">
						<div className="flex items-center gap-2">
							<div className="flex size-6 items-center justify-center rounded-full bg-fd-muted">
								<svg
									className="size-3.5 text-fd-muted-foreground"
									fill="none"
									stroke="currentColor"
									strokeWidth={1.5}
									viewBox="0 0 24 24"
								>
									<path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
								</svg>
							</div>
							{!showCards && <TypingDots />}
							{showCards && (
								<span className="text-xs text-fd-muted-foreground sm:text-sm animate-[fade-in_0.3s_ease]">
									Here are some options:
								</span>
							)}
						</div>

						{showCards && (
							<div className="flex gap-2 overflow-x-auto pl-8">
								{Array.from({ length: 4 }).map((_, i) => (
									<ProductCard
										key={i}
										delay={i * 150}
									/>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
