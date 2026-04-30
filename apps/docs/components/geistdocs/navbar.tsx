import { Logo } from "@/components/logo";
import { nav } from "@/lib/constants";
import { AskAIButton } from "./ask-ai-button";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import { NavbarLogo } from "./navbar-logo";
import { SearchButton } from "./search-button";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Navbar({ navigation }: { navigation?: NavSection[] }) {
  return (
    <>
      <div className="h-16" />
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 justify-center border-b bg-background-200 [backface-visibility:hidden]">
        <div className="mx-auto flex w-full justify-between px-2">
          <div className="flex select-none flex-row items-center">
            <NavbarLogo className="ml-4" logo={<Logo />} variant="oss" />
            <DesktopMenu className="hidden pl-6 lg:flex" items={nav} />
          </div>
          <div className="mr-4 flex flex-row items-center justify-end gap-2">
            <SearchButton className="hidden lg:flex" />
            <AskAIButton />
            <MobileMenu navigation={navigation} />
          </div>
        </div>
      </header>
    </>
  );
}
