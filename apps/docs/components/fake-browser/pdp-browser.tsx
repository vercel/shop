import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

export const PDPBrowser = () => (
	<BrowserChrome url="vercel.shop/products/classic-tee">
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

			{/* Product detail area */}
			<div className="mb-3 grid grid-cols-[1fr_1fr_0.5fr] gap-3">
				{/* Product image */}
				<ImagePlaceholder className="aspect-square rounded-md" />

				{/* Product info */}
				<div className="flex flex-col gap-2 py-1">
					<div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
					<div className="h-3 w-4/5 rounded bg-black/10 dark:bg-white/10" />
					<div className="h-3 w-3/5 rounded bg-black/10 dark:bg-white/10" />
					<div className="mt-1 flex gap-1.5">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="size-5 rounded bg-black/10 dark:bg-white/10" />
						))}
					</div>
					<div className="mt-1 h-3 w-1/3 rounded bg-black/10 dark:bg-white/10" />
				</div>

				{/* Side thumbnail */}
				<ImagePlaceholder className="aspect-[3/4] rounded-md" />
			</div>

			{/* Recommendations - dynamic */}
			<DynamicBoundary label="Recommendations">
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<ImagePlaceholder
							key={i}
							className="aspect-square rounded"
						/>
					))}
				</div>
			</DynamicBoundary>
		</StaticBoundary>
	</BrowserChrome>
);
