import { SiVercel } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { nav } from "@/lib/constants";
import { SlashIcon } from "./icons";

export const Navbar = () => (
  <header className="sticky top-0 z-40 w-full border-b bg-sidebar">
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
      <nav className="ml-4 flex items-center gap-6">
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
    </div>
  </header>
);
