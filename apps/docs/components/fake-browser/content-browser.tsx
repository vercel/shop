import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

export const ContentBrowser = () => (
	<BrowserChrome url="vercel.shop/pages/about">
		<StaticBoundary>
			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="size-7 rounded-full bg-fd-muted" />
					<div className="h-3 w-24 rounded bg-fd-muted" />
				</div>
				<DynamicBoundary label="Cart" className="!p-1.5 !rounded">
					<div className="size-5 rounded bg-fd-muted" />
				</DynamicBoundary>
			</div>

			{/* CMS content */}
			<DynamicBoundary label="CMS content">
				{/* Hero banner */}
				<div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-gradient-to-r from-fd-muted to-fd-muted/50">
					<div className="flex flex-col items-center gap-2">
						<div className="h-5 w-40 rounded bg-fd-muted-foreground/20" />
						<div className="h-2.5 w-56 rounded bg-fd-muted-foreground/15" />
						<div className="mt-1 h-6 w-24 rounded-md bg-fd-muted-foreground/25" />
					</div>
				</div>

				{/* Three columns */}
				<div className="mb-4 grid grid-cols-3 gap-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex flex-col gap-2 rounded-lg bg-fd-muted/30 p-2.5">
							<div className="mx-auto mb-1 size-8 rounded-full bg-fd-muted" />
							<div className="mx-auto h-3 w-20 rounded bg-fd-muted" />
							<div className="h-2 w-full rounded bg-fd-muted" />
							<div className="h-2 w-full rounded bg-fd-muted" />
							<div className="h-2 w-3/5 rounded bg-fd-muted" />
						</div>
					))}
				</div>

				{/* Image + text row */}
				<div className="mb-4 grid grid-cols-2 gap-3">
					<ImagePlaceholder className="aspect-video rounded-md" />
					<div className="flex flex-col justify-center gap-2">
						<div className="h-3.5 w-32 rounded bg-fd-muted" />
						<div className="h-2 w-full rounded bg-fd-muted" />
						<div className="h-2 w-full rounded bg-fd-muted" />
						<div className="h-2 w-4/5 rounded bg-fd-muted" />
						<div className="mt-1 h-6 w-24 rounded-md bg-fd-muted-foreground/20" />
					</div>
				</div>

				{/* Text + image row (reversed) */}
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col justify-center gap-2">
						<div className="h-3.5 w-28 rounded bg-fd-muted" />
						<div className="h-2 w-full rounded bg-fd-muted" />
						<div className="h-2 w-full rounded bg-fd-muted" />
						<div className="h-2 w-3/5 rounded bg-fd-muted" />
						<div className="mt-1 h-6 w-24 rounded-md bg-fd-muted-foreground/20" />
					</div>
					<ImagePlaceholder className="aspect-video rounded-md" />
				</div>
			</DynamicBoundary>
		</StaticBoundary>
	</BrowserChrome>
);
