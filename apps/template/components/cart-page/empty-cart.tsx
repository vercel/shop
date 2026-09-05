import Link from "next/link";

export function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 px-5">
      <h2 className="text-2xl sm:text-3xl">Your cart is empty</h2>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
