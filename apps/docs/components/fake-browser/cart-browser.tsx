import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

const CartItem = () => (
	<div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-2.5">
		<ImagePlaceholder className="size-12 shrink-0 rounded" />
		<div className="flex flex-1 flex-col gap-1">
			<div className="h-2.5 w-28 rounded bg-black/10 dark:bg-white/10" />
			<div className="h-2 w-16 rounded bg-black/10 dark:bg-white/10" />
		</div>
		<div className="flex items-center gap-1.5">
			<div className="size-5 rounded border border-black/15 dark:border-white/15 bg-fd-background" />
			<div className="h-3 w-4 rounded bg-black/10 dark:bg-white/10" />
			<div className="size-5 rounded border border-black/15 dark:border-white/15 bg-fd-background" />
		</div>
		<div className="h-3 w-12 rounded bg-black/10 dark:bg-white/10" />
	</div>
);

export const CartBrowser = () => (
	<BrowserChrome url="vercel.shop/cart">
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

			{/* Cart title */}
			<div className="mb-3 h-4 w-24 rounded bg-black/10 dark:bg-white/10" />

			{/* Cart content - dynamic */}
			<DynamicBoundary label="Cart items">
				<div className="flex flex-col gap-2.5">
					<CartItem />
					<CartItem />
					<CartItem />
				</div>

				{/* Totals */}
				<div className="mt-3 flex flex-col items-end gap-1.5">
					<div className="flex items-center gap-8">
						<div className="h-2 w-14 rounded bg-black/10 dark:bg-white/10" />
						<div className="h-2.5 w-16 rounded bg-black/10 dark:bg-white/10" />
					</div>
					<div className="flex items-center gap-8">
						<div className="h-2 w-10 rounded bg-black/10 dark:bg-white/10" />
						<div className="h-2.5 w-16 rounded bg-black/10 dark:bg-white/10" />
					</div>
					<div className="my-1 h-px w-32 bg-black/10 dark:bg-white/10" />
					<div className="flex items-center gap-8">
						<div className="h-3 w-12 rounded bg-black/10 dark:bg-white/10" />
						<div className="h-3 w-20 rounded bg-black/10 dark:bg-white/10" />
					</div>
					<div className="mt-2 h-8 w-36 rounded-md bg-black/10 dark:bg-white/10" />
				</div>
			</DynamicBoundary>
		</StaticBoundary>
	</BrowserChrome>
);
