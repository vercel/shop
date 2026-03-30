import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

export const PLPBrowser = () => (
	<BrowserChrome url="vercel.shop/collections/all">
		<StaticBoundary>
			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="size-7 rounded-full bg-black/10 dark:bg-white/10" />
					<div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
				</div>
				<DynamicBoundary label="Cart" className="!p-1.5 !rounded">
					<div className="size-5 rounded bg-black/10 dark:bg-white/10" />
				</DynamicBoundary>
			</div>

			{/* Collection title */}
			<div className="mb-3">
				<div className="mb-1 h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
				<div className="h-2 w-48 rounded bg-black/10 dark:bg-white/10" />
			</div>

			{/* Filter + Grid layout */}
			<div className="grid grid-cols-[0.8fr_3fr] gap-3">
				{/* Filter sidebar */}
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<div className="h-2.5 w-12 rounded bg-black/10 dark:bg-white/10" />
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-center gap-1.5">
								<div className="size-3 rounded-sm border border-black/15 dark:border-white/15" />
								<div className="h-2 w-14 rounded bg-black/10 dark:bg-white/10" />
							</div>
						))}
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="h-2.5 w-10 rounded bg-black/10 dark:bg-white/10" />
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="flex items-center gap-1.5">
								<div className="size-3 rounded-sm border border-black/15 dark:border-white/15" />
								<div className="h-2 w-12 rounded bg-black/10 dark:bg-white/10" />
							</div>
						))}
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="h-2.5 w-10 rounded bg-black/10 dark:bg-white/10" />
						<div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10" />
					</div>
				</div>

				{/* Product grid - dynamic */}
				<DynamicBoundary label="Results">
					<div className="mb-2 flex items-center justify-between">
						<div className="h-2 w-20 rounded bg-black/10 dark:bg-white/10" />
						<div className="h-5 w-24 rounded border border-black/15 dark:border-white/15 bg-fd-background" />
					</div>
					<div className="grid grid-cols-4 gap-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex flex-col gap-1">
								<ImagePlaceholder className="aspect-square rounded" />
								<div className="h-2 w-full rounded bg-black/10 dark:bg-white/10" />
								<div className="h-2 w-1/2 rounded bg-black/10 dark:bg-white/10" />
							</div>
						))}
					</div>
				</DynamicBoundary>
			</div>
		</StaticBoundary>
	</BrowserChrome>
);
