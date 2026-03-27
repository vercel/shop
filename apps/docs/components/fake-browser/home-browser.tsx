import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

const NavBar = () => (
	<div className="mb-3 flex items-center justify-between">
		<div className="flex items-center gap-2">
			<div className="size-7 rounded-full bg-fd-muted" />
			<div className="h-3 w-24 rounded bg-fd-muted" />
		</div>
		<div className="flex items-center gap-3">
			<div className="h-3 w-14 rounded bg-fd-muted" />
			<div className="h-3 w-14 rounded bg-fd-muted" />
			<DynamicBoundary label="Cart" className="!p-1.5 !rounded">
				<div className="size-5 rounded bg-fd-muted" />
			</DynamicBoundary>
		</div>
	</div>
);

export const HomeBrowser = () => (
	<BrowserChrome url="vercel.shop">
		<StaticBoundary>
			<NavBar />

			{/* Hero banner */}
			<div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gradient-to-r from-fd-muted to-fd-muted/50">
				<div className="flex flex-col items-center gap-2">
					<div className="h-4 w-36 rounded bg-fd-muted-foreground/20" />
					<div className="h-3 w-48 rounded bg-fd-muted-foreground/15" />
					<div className="mt-1 h-6 w-20 rounded-md bg-fd-muted-foreground/25" />
				</div>
			</div>

			{/* Featured products carousel */}
			<DynamicBoundary label="Products" className="mb-3">
				<div className="mb-2 h-3 w-28 rounded bg-fd-muted" />
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex flex-col gap-1.5">
							<ImagePlaceholder className="aspect-square rounded" />
							<div className="h-2 w-full rounded bg-fd-muted" />
							<div className="h-2 w-2/3 rounded bg-fd-muted" />
						</div>
					))}
				</div>
			</DynamicBoundary>

			{/* Info section */}
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-2 rounded-lg bg-fd-muted/50 p-3">
					<div className="h-3 w-24 rounded bg-fd-muted" />
					<div className="h-2 w-full rounded bg-fd-muted" />
					<div className="h-2 w-4/5 rounded bg-fd-muted" />
				</div>
				<div className="flex flex-col gap-2 rounded-lg bg-fd-muted/50 p-3">
					<div className="h-3 w-24 rounded bg-fd-muted" />
					<div className="h-2 w-full rounded bg-fd-muted" />
					<div className="h-2 w-3/5 rounded bg-fd-muted" />
				</div>
			</div>
		</StaticBoundary>
	</BrowserChrome>
);
