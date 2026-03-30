import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

const NavBar = () => (
	<div className="mb-3 flex items-center justify-between">
		<div className="flex items-center gap-2">
			<div className="size-7 rounded-full bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
		</div>
		<div className="flex items-center gap-3">
			<div className="h-3 w-14 rounded bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-14 rounded bg-black/10 dark:bg-white/10" />
			<DynamicBoundary label="Cart" className="!p-1.5 !rounded">
				<div className="size-5 rounded bg-black/10 dark:bg-white/10" />
			</DynamicBoundary>
		</div>
	</div>
);

export const HomeBrowser = () => (
	<BrowserChrome url="vercel.shop">
		<StaticBoundary>
			<NavBar />

			{/* Hero banner */}
			<div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gradient-to-r from-black/10 to-black/5 dark:from-white/10 dark:to-white/5">
				<div className="flex flex-col items-center gap-2">
					<div className="h-4 w-36 rounded bg-black/15 dark:bg-white/15" />
					<div className="h-3 w-48 rounded bg-black/10 dark:bg-white/10" />
					<div className="mt-1 h-6 w-20 rounded-md bg-black/10 dark:bg-white/10" />
				</div>
			</div>

			{/* Featured products carousel */}
			<DynamicBoundary label="Products" className="mb-3">
				<div className="mb-2 h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex flex-col gap-1.5">
							<ImagePlaceholder className="aspect-square rounded" />
							<div className="h-2 w-full rounded bg-black/10 dark:bg-white/10" />
							<div className="h-2 w-2/3 rounded bg-black/10 dark:bg-white/10" />
						</div>
					))}
				</div>
			</DynamicBoundary>

			{/* Info section */}
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-2 rounded-lg bg-black/5 dark:bg-white/5 p-3">
					<div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
					<div className="h-2 w-full rounded bg-black/10 dark:bg-white/10" />
					<div className="h-2 w-4/5 rounded bg-black/10 dark:bg-white/10" />
				</div>
				<div className="flex flex-col gap-2 rounded-lg bg-black/5 dark:bg-white/5 p-3">
					<div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
					<div className="h-2 w-full rounded bg-black/10 dark:bg-white/10" />
					<div className="h-2 w-3/5 rounded bg-black/10 dark:bg-white/10" />
				</div>
			</div>
		</StaticBoundary>
	</BrowserChrome>
);
