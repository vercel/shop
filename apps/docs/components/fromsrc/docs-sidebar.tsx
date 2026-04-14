"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { IconPanelLeft } from "fromsrc/client"
import { cn } from "@/lib/utils"

export interface DocsSidebarItem {
  badge?: string
  href: string
  title: string
}

export interface DocsSidebarSection {
  items: DocsSidebarItem[]
  title: string
}

interface DocsSidebarProps {
  collapsible?: boolean
  navigation: DocsSidebarSection[]
  title: string
  width?: number
}

export function DocsSidebar({
  collapsible,
  navigation,
  title,
  width = 268,
}: DocsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [floating, setFloating] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const floatingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const widthValue = `${width}px`

  useEffect(() => {
    if (floatingTimer.current) {
      clearTimeout(floatingTimer.current)
      floatingTimer.current = null
    }

    if (!collapsed || hovered) {
      setFloating(false)
      return
    }

    floatingTimer.current = setTimeout(() => setFloating(true), 220)

    return () => {
      if (floatingTimer.current) {
        clearTimeout(floatingTimer.current)
        floatingTimer.current = null
      }
    }
  }, [collapsed, hovered])

  useEffect(
    () => () => {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current)
        leaveTimer.current = null
      }

      if (floatingTimer.current) {
        clearTimeout(floatingTimer.current)
        floatingTimer.current = null
      }
    },
    []
  )

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const handleEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") {
        return
      }

      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current)
        leaveTimer.current = null
      }

      if (collapsed) {
        setHovered(true)
      }
    },
    [collapsed]
  )

  const handleLeave = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") {
      return
    }

    if (event.clientX <= 0) {
      return
    }

    const distance = Math.min(
      event.clientX,
      document.body.clientWidth - event.clientX
    )
    const delay = distance > 100 ? 0 : 500

    leaveTimer.current = setTimeout(() => setHovered(false), delay)
  }, [])

  const openSearch = useCallback(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "k",
        metaKey: true,
      })
    )
  }, [])

  const showExpanded = !collapsed || hovered
  const shadow = collapsed && hovered ? "shadow-xl" : ""
  const translate =
    collapsed && !hovered ? `translateX(-${width}px)` : "translateX(0px)"

  return (
    <>
      <div className="hidden shrink-0 lg:block" style={{ width: widthValue }} />
      <div
        className="pointer-events-none fixed top-0 left-0 z-40 hidden h-screen will-change-transform [backface-visibility:hidden] lg:block"
        style={{ width: widthValue }}
      >
        {collapsed && !hovered && (
          <div
            className="pointer-events-auto fixed inset-y-0 left-0 z-40"
            style={{ width: "12px" }}
            onPointerEnter={handleEnter}
          />
        )}

        <aside
          aria-expanded={showExpanded}
          aria-label="sidebar navigation"
          className={`${shadow} pointer-events-auto flex h-full flex-col border-r border-line bg-bg transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-transform [backface-visibility:hidden]`}
          data-collapsed={collapsed}
          data-hovered={collapsed && hovered}
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
          style={{ transform: translate, width: widthValue }}
        >
          <SidebarHeader
            collapsed={collapsed}
            collapsible={collapsible}
            onToggle={toggle}
            title={title}
          />
          <SidebarSearch onOpen={openSearch} showExpanded={showExpanded} />
          <SidebarNav navigation={navigation} />
        </aside>
      </div>

      {floating && (
        <div className="pointer-events-auto fixed top-0 left-0 z-50 hidden p-3 lg:flex">
          <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface/80 backdrop-blur-sm">
            <button
              aria-label="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:bg-surface hover:text-fg"
              onClick={toggle}
              type="button"
            >
              <IconPanelLeft size={16} />
            </button>
            <button
              aria-keyshortcuts="Meta+K"
              aria-label="Open search"
              className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:bg-surface hover:text-fg"
              onClick={openSearch}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function SidebarHeader({
  collapsed,
  collapsible,
  onToggle,
  title,
}: {
  collapsed: boolean
  collapsible?: boolean
  onToggle: () => void
  title: string
}) {
  return (
    <div className="flex h-14 items-center px-4">
      {collapsible && (
        <button
          aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
          aria-pressed={!collapsed}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-muted transition-colors hover:text-fg"
          onClick={onToggle}
          type="button"
        >
          <IconPanelLeft size={18} />
        </button>
      )}
      <Link
        className="flex items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
        href="/"
      >
        <div className="h-8 w-8 shrink-0" />
        <span className="whitespace-nowrap">{title}</span>
      </Link>
    </div>
  )
}

function SidebarSearch({
  onOpen,
  showExpanded,
}: {
  onOpen: () => void
  showExpanded: boolean
}) {
  return (
    <div className="flex items-center px-4 pb-2">
      <button
        aria-keyshortcuts="Meta+K"
        aria-label="Open search"
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface/40 px-3 text-muted transition-colors hover:bg-surface/80 hover:text-fg"
        onClick={onOpen}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <span className={cn("text-sm", showExpanded ? "block" : "hidden")}>
          Search...
        </span>
        <kbd
          className={cn(
            "ml-auto text-[10px] font-mono text-muted/50",
            showExpanded ? "block" : "hidden"
          )}
        >
          ⌘K
        </kbd>
      </button>
    </div>
  )
}

function SidebarNav({ navigation }: { navigation: DocsSidebarSection[] }) {
  return (
    <nav
      aria-label="documentation"
      className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-2 pb-8 overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {navigation.map((section) => (
        <section
          aria-labelledby={`section-${section.title || "docs"}`}
          className="mb-6"
          key={section.title || "docs"}
        >
          <h3
            className="mb-2 px-2 text-xs font-medium whitespace-nowrap text-muted/70"
            id={`section-${section.title || "docs"}`}
          >
            {section.title}
          </h3>
          <ul className="space-y-px" role="list">
            {section.items.map((item) => (
              <li key={item.href}>
                <SidebarLink {...item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

function SidebarLink({ badge, href, title }: DocsSidebarItem) {
  const pathname = usePathname()
  const isActive = pathname === href
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isActive])

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors [transition-duration:150ms] hover:[transition-duration:0ms]",
        isActive
          ? "bg-surface/80 font-medium text-fg"
          : "text-muted hover:bg-surface/50 hover:text-fg"
      )}
      href={href}
      prefetch
      ref={ref}
    >
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {badge && (
        <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {badge}
        </span>
      )}
    </Link>
  )
}
