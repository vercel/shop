"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BottomBarSearch } from "./bottom-bar-search";
import { MenuTriggerIcon } from "./nav/megamenu/menu-trigger-icon";

const easing = [0.32, 0.72, 0, 1] as const;

function vibrate(): void {
  try {
    navigator.vibrate([50]);
  } catch {
    // noop
  }
}

interface BottomBarProps {
  children?: ReactNode;
}

export function BottomBar({ children }: BottomBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel("megamenu");
    channel.onmessage = (ev) => {
      const { type } = ev.data;
      if (type === "close") setMenuOpen(false);
    };
    return () => channel.close();
  }, []);

  function toggleMenu() {
    vibrate();
    const channel = new BroadcastChannel("megamenu");
    channel.postMessage({ type: "toggle" });
    channel.close();
    setMenuOpen((prev) => !prev);
  }

  function openSearch() {
    vibrate();
    setSearchOpen(true);
  }

  function closeSearch() {
    vibrate();
    setSearchOpen(false);
  }

  return (
    <motion.div
      layout
      transition={{ duration: 0.35, ease: easing }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center bg-input/80 backdrop-blur-md h-12 rounded-full shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] outline -outline-offset-1 outline-border/35"
      style={{
        width: searchOpen ? "calc(100vw - 3rem)" : "auto",
        maxWidth: searchOpen ? "40rem" : "none",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {searchOpen ? (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full items-center gap-2 pl-4 pr-1"
          >
            <BottomBarSearch onClose={closeSearch} />
          </motion.div>
        ) : (
          <motion.div
            key="nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 pl-3 pr-1"
          >
            <button
              type="button"
              className="flex md:hidden items-center gap-1.5 px-2 py-1"
              onClick={toggleMenu}
            >
              {menuOpen ? (
                <X className="size-4 text-foreground opacity-50" />
              ) : (
                <MenuTriggerIcon className="size-4 text-foreground opacity-50" />
              )}
              <span className="text-xs font-medium text-foreground opacity-50">
                Browse
              </span>
            </button>
            <div className="w-px h-5 bg-border/50 md:hidden" />
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-1"
              onClick={openSearch}
            >
              <Search className="size-4 text-foreground opacity-50" />
              <span className="text-xs font-medium text-foreground opacity-50">
                Search
              </span>
            </button>
            {children ? <div className="w-px h-5 bg-border/50" /> : null}
          </motion.div>
        )}
      </AnimatePresence>
      {children ? (
        <div
          className={
            searchOpen
              ? "pointer-events-none absolute -z-10 opacity-0"
              : "flex items-center pr-2"
          }
        >
          {children}
        </div>
      ) : null}
    </motion.div>
  );
}
