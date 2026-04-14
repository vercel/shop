import { ShopLink as Link } from "@/components/ui/shop-link";

const links = [
  { label: "Shop", href: "/search" },
  { label: "About", href: "/about" },
];

export function QuickLinks() {
  return (
    <div className="hidden md:flex items-center gap-6">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
