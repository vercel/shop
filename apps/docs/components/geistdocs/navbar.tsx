import { SiVercel } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { Logo, nav } from "@/site.config";
import { SlashIcon } from "./icons";

export const Navbar = () => (
  <header className="sticky top-0 z-40 w-full gap-6 border-b bg-sidebar">
    <div className="mx-auto flex h-16 w-full items-center gap-4 px-4 py-3.5 md:px-6">
      <div className="flex shrink-0 items-center gap-2.5">
        <a href="https://vercel.com/" rel="noopener" target="_blank">
          <SiVercel className="size-5" />
        </a>
        <SlashIcon className="size-5 text-border" />
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <nav className="ml-4 hidden items-center gap-6 xl:flex">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            {...(item.target ? { target: item.target, rel: "noopener" } : {})}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        {/* Search and chat will be re-added in Phase 3/4 */}
      </div>
    </div>
  </header>
);
