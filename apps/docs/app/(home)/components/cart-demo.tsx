"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase =
	| "idle"
	| "cursor-enter"
	| "cursor-on-button"
	| "press"
	| "updated"
	| "hold";

const ShoppingBagIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
		/>
	</svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<circle cx="8" cy="9" r="2.5" />
		<path d="M21 17l-5-5-4 4-3-3-5 5v2h17z" />
	</svg>
);

const CursorIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
	</svg>
);

export const CartDemo = () => {
	const [phase, setPhase] = useState<Phase>("idle");
	const ref = useRef<HTMLDivElement>(null);
	const hasStarted = useRef(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const clearTimeouts = useCallback(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
	}, []);

	const runAnimation = useCallback(() => {
		setPhase("cursor-enter");

		// Cursor arrives on button after the CSS transition (600ms)
		timeoutRef.current = setTimeout(() => {
			setPhase("cursor-on-button");

			// Brief pause, then click
			timeoutRef.current = setTimeout(() => {
				setPhase("press");

				// Release + instant update
				timeoutRef.current = setTimeout(() => {
					setPhase("updated");

					// Hold, then reset and replay
					timeoutRef.current = setTimeout(() => {
						setPhase("hold");
						timeoutRef.current = setTimeout(() => {
							setPhase("idle");
							timeoutRef.current = setTimeout(() => {
								runAnimation();
							}, 1500);
						}, 2500);
					}, 100);
				}, 200);
			}, 400);
		}, 650);
	}, []);

	useEffect(() => {
		if (hasStarted.current) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting && !hasStarted.current) {
					hasStarted.current = true;
					observer.disconnect();
					setTimeout(() => runAnimation(), 800);
				}
			},
			{ threshold: 0.5 },
		);

		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, [runAnimation]);

	useEffect(() => {
		return clearTimeouts;
	}, [clearTimeouts]);

	const isUpdated = phase === "updated" || phase === "hold";
	const showCursor =
		phase === "cursor-enter" ||
		phase === "cursor-on-button" ||
		phase === "press";
	const isPressing = phase === "press";

	return (
		<div
			ref={ref}
			className="relative flex h-64 flex-col overflow-hidden rounded-xl border bg-black/5 dark:bg-white/5 sm:h-72"
		>
			{/* Header with cart icon */}
			<div className="flex items-center justify-between px-4 py-2.5">
				<span className="text-[11px] font-medium text-fd-muted-foreground">
					Products
				</span>
				<div className="relative flex items-center gap-1.5">
					<span className="text-[11px] text-fd-muted-foreground">
						Cart
					</span>
					<div className="relative">
						<ShoppingBagIcon className="size-4 text-fd-foreground" />
						{isUpdated && (
							<span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-fd-primary text-[8px] font-bold text-fd-primary-foreground animate-[scale-in_0.15s_ease-out]">
								1
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Split view: products | cart */}
			<div className="flex flex-1 gap-px overflow-hidden bg-fd-border">
				{/* Product list */}
				<div className="relative flex flex-1 flex-col gap-2 bg-black/5 p-3 dark:bg-white/5">
					{/* First product row */}
					<div className="flex items-center gap-3 rounded-lg border bg-fd-background p-2.5">
						<div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 sm:size-16">
							<ImageIcon className="size-5 text-black/20 dark:text-white/20" />
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="h-2.5 w-24 rounded bg-black/10 dark:bg-white/10" />
							<div className="h-2.5 w-14 rounded bg-black/10 dark:bg-white/10" />
						</div>
						<button
							type="button"
							onClick={() => {
								if (phase === "idle") runAnimation();
							}}
							disabled={phase !== "idle"}
							className={`flex shrink-0 items-center gap-1 rounded-md bg-black px-2.5 py-1.5 text-[11px] font-medium text-white dark:bg-white dark:text-black transition-transform sm:text-xs ${
								phase === "idle"
									? "cursor-pointer hover:opacity-90"
									: "cursor-default"
							} ${isPressing ? "scale-90" : "scale-100"}`}
						>
							<ShoppingBagIcon className="size-3.5" />
							<span className="hidden sm:inline">Add</span>
						</button>
					</div>

					{/* Ghost rows */}
					<div className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 opacity-40">
						<div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 sm:size-16">
							<ImageIcon className="size-5 text-black/20 dark:text-white/20" />
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="h-2.5 w-20 rounded bg-black/10 dark:bg-white/10" />
							<div className="h-2.5 w-10 rounded bg-black/10 dark:bg-white/10" />
						</div>
					</div>
					<div className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 opacity-20">
						<div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 sm:size-16">
							<ImageIcon className="size-5 text-black/20 dark:text-white/20" />
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="h-2.5 w-16 rounded bg-black/10 dark:bg-white/10" />
							<div className="h-2.5 w-12 rounded bg-black/10 dark:bg-white/10" />
						</div>
					</div>

					{/* Animated cursor */}
					{showCursor && (
						<div
							className="pointer-events-none absolute z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] drop-shadow-md"
							style={{
								top:
									phase === "cursor-enter"
										? "75%"
										: "42px",
								right:
									phase === "cursor-enter"
										? "5%"
										: "28px",
							}}
						>
							<CursorIcon
								className={`size-6 text-fd-foreground transition-transform duration-100 ${
									isPressing ? "scale-75" : "scale-100"
								}`}
							/>
						</div>
					)}
				</div>

				{/* Cart panel */}
				<div className="flex w-[38%] flex-col bg-fd-background p-3 sm:w-[35%]">
					{isUpdated ? (
						<div className="flex flex-col gap-2.5 animate-[fade-in_0.15s_ease]">
							<div className="flex gap-2">
								<div className="flex size-10 shrink-0 items-center justify-center rounded bg-black/10 dark:bg-white/10">
									<ImageIcon className="size-3.5 text-black/20 dark:text-white/20" />
								</div>
								<div className="flex flex-col gap-1 pt-0.5">
									<div className="h-2 w-14 rounded bg-black/10 dark:bg-white/10" />
									<div className="h-2 w-9 rounded bg-black/10 dark:bg-white/10" />
								</div>
							</div>
							<div className="mt-auto flex items-center justify-between border-t pt-2 text-[10px]">
								<span className="text-fd-muted-foreground">Total</span>
								<span className="font-medium text-fd-foreground">$29.99</span>
							</div>
						</div>
					) : (
						<div className="flex flex-1 items-center justify-center">
							<span className="text-[10px] text-fd-muted-foreground/60">
								Empty
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
