const ImagePlaceholder = ({ className }: { className?: string }) => (
	<div
		className={`flex items-center justify-center bg-fd-muted ${className ?? ""}`}
	>
		<svg
			className="size-8 text-fd-muted-foreground/40"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<circle cx="8" cy="9" r="2.5" />
			<path d="M21 17l-5-5-4 4-3-3-5 5v2h17z" />
		</svg>
	</div>
);

const StaticBadge = () => (
	<span className="inline-flex size-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
		S
	</span>
);

const DynamicBadge = ({ label }: { label: string }) => (
	<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold whitespace-nowrap text-white transition-all duration-200 group-hover/dynamic:px-2 group-focus-within/dynamic:px-2">
		<span>D</span>
		<span className="ml-0 max-w-0 overflow-hidden transition-all duration-200 group-hover/dynamic:ml-1 group-hover/dynamic:max-w-32 group-focus-within/dynamic:ml-1 group-focus-within/dynamic:max-w-32">
			{label}
		</span>
	</span>
);

export const FakeBrowser = () => (
	<div className="w-full rounded-xl border bg-fd-background shadow-xl">
		{/* Browser chrome */}
		<div className="relative flex items-center justify-center overflow-hidden rounded-t-xl border-b bg-fd-muted/50 px-4 py-2.5">
			<div className="absolute left-4 flex gap-1.5">
				<div className="size-3 rounded-full bg-red-400" />
				<div className="size-3 rounded-full bg-yellow-400" />
				<div className="size-3 rounded-full bg-green-400" />
			</div>
			<div className="flex items-center gap-2 rounded-lg border bg-fd-background px-8 py-1.5 text-sm text-fd-muted-foreground">
				<svg
					className="size-3.5"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					viewBox="0 0 24 24"
				>
					<rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
					<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				</svg>
				vercel.shop
			</div>
		</div>

		{/* Page content */}
		<div className="relative p-5">
			{/* Static boundary - wraps entire page */}
			<div className="relative rounded-lg border-2 border-purple-400 bg-white p-3 dark:bg-purple-950/20">
				{/* S badge */}
				<div className="absolute -top-2.5 -left-2.5">
					<StaticBadge />
				</div>

				{/* Header */}
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="size-7 rounded-full bg-fd-muted" />
						<div className="h-3 w-24 rounded bg-fd-muted" />
					</div>
					{/* Cart - dynamic */}
					<div tabIndex={0} className="group/dynamic relative cursor-default rounded border-2 border-dashed border-blue-400 bg-blue-100/70 p-1.5 outline-none transition-colors hover:bg-blue-200/60 focus-within:bg-blue-200/60 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:focus-within:bg-blue-900/30">
						<div className="absolute -top-2.5 -right-2.5">
							<DynamicBadge label="Cart" />
						</div>
						<div className="size-5 rounded bg-fd-muted" />
					</div>
				</div>

				{/* Product detail area */}
				<div className="mb-3 grid grid-cols-[1fr_1fr_0.5fr] gap-3">
					{/* Product image */}
					<ImagePlaceholder className="aspect-square rounded-md" />

					{/* Product info */}
					<div className="flex flex-col gap-2 py-1">
						<div className="h-3 w-full rounded bg-fd-muted" />
						<div className="h-3 w-4/5 rounded bg-fd-muted" />
						<div className="h-3 w-3/5 rounded bg-fd-muted" />
						<div className="mt-1 flex gap-1.5">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="size-5 rounded bg-fd-muted"
								/>
							))}
						</div>
						<div className="mt-1 h-3 w-1/3 rounded bg-fd-muted" />
					</div>

					{/* Side thumbnail */}
					<ImagePlaceholder className="aspect-[3/4] rounded-md" />
				</div>

				{/* Recommendations - dynamic */}
				<div tabIndex={0} className="group/dynamic relative cursor-default rounded-lg border-2 border-dashed border-blue-400 bg-blue-100/70 p-2.5 outline-none transition-colors hover:bg-blue-200/60 focus-within:bg-blue-200/60 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:focus-within:bg-blue-900/30">
					<div className="absolute -top-2.5 -left-2.5">
						<DynamicBadge label="Recommendations" />
					</div>
					<div className="grid grid-cols-5 gap-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<ImagePlaceholder
								key={i}
								className="aspect-square rounded"
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	</div>
);
