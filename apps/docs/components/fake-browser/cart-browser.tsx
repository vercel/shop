import { BrowserChrome } from "./browser-chrome";
import {
	DynamicBoundary,
	ImagePlaceholder,
	StaticBoundary,
} from "./primitives";

const CartItem = () => (
	<div className="flex items-center gap-3 border-b border-fd-muted pb-2.5">
		<ImagePlaceholder className="size-12 shrink-0 rounded" />
		<div className="flex flex-1 flex-col gap-1">
			<div className="h-2.5 w-28 rounded bg-fd-muted" />
			<div className="h-2 w-16 rounded bg-fd-muted" />
		</div>
		<div className="flex items-center gap-1.5">
			<div className="size-5 rounded border border-fd-muted-foreground/20 bg-fd-background" />
			<div className="h-3 w-4 rounded bg-fd-muted" />
			<div className="size-5 rounded border border-fd-muted-foreground/20 bg-fd-background" />
		</div>
		<div className="h-3 w-12 rounded bg-fd-muted" />
	</div>
);

export const CartBrowser = () => (
	<BrowserChrome url="vercel.shop/cart">
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

			{/* Cart title */}
			<div className="mb-3 h-4 w-24 rounded bg-fd-muted" />

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
						<div className="h-2 w-14 rounded bg-fd-muted" />
						<div className="h-2.5 w-16 rounded bg-fd-muted" />
					</div>
					<div className="flex items-center gap-8">
						<div className="h-2 w-10 rounded bg-fd-muted" />
						<div className="h-2.5 w-16 rounded bg-fd-muted" />
					</div>
					<div className="my-1 h-px w-32 bg-fd-muted" />
					<div className="flex items-center gap-8">
						<div className="h-3 w-12 rounded bg-fd-muted" />
						<div className="h-3 w-20 rounded bg-fd-muted" />
					</div>
					<div className="mt-2 h-8 w-36 rounded-md bg-fd-muted-foreground/25" />
				</div>
			</DynamicBoundary>
		</StaticBoundary>
	</BrowserChrome>
);
