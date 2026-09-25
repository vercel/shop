"use client";

import NextLink from "next/link";
import { type ComponentProps, useEffect, useRef, useState } from "react";

const INTENT_DELAY_MS = 100;

interface Connection {
  saveData?: boolean;
}

interface LinkProps extends Omit<ComponentProps<typeof NextLink>, "prefetch"> {
  prefetch?: ComponentProps<typeof NextLink>["prefetch"] | "intent";
}

function canPrefetch(anchor: HTMLAnchorElement): boolean {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;

  if (
    !anchor.isConnected ||
    document.visibilityState !== "visible" ||
    !navigator.onLine ||
    connection?.saveData ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target.toLowerCase() !== "_self") ||
    anchor.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  try {
    const current = new URL(window.location.href);
    const destination = new URL(anchor.href);

    return (
      (destination.protocol === "http:" || destination.protocol === "https:") &&
      destination.origin === current.origin &&
      (destination.pathname !== current.pathname || destination.search !== current.search)
    );
  } catch {
    return false;
  }
}

export function Link({
  as,
  href,
  onBlur,
  onFocus,
  onPointerCancel,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  prefetch = "intent",
  ...props
}: LinkProps) {
  const destinationKey = JSON.stringify([href, as]);
  const [intentDestination, setIntentDestination] = useState<string | null>(null);
  const focused = useRef(false);
  const hovered = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  function cancelIntent() {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
    setIntentDestination(null);
  }

  function scheduleIntent(anchor: HTMLAnchorElement) {
    cancelIntent();
    if (prefetch !== "intent" || !canPrefetch(anchor)) return;

    const destination = anchor.href;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      if (anchor.href === destination && canPrefetch(anchor)) {
        setIntentDestination(destinationKey);
      }
    }, INTENT_DELAY_MS);
  }

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <NextLink
      {...props}
      as={as}
      href={href}
      onBlur={(event) => {
        onBlur?.(event);
        focused.current = false;
        if (!hovered.current) cancelIntent();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented || !event.currentTarget.matches(":focus-visible")) return;
        focused.current = true;
        scheduleIntent(event.currentTarget);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        hovered.current = false;
        cancelIntent();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (
          event.pointerType === "touch" ||
          event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          hovered.current = false;
          cancelIntent();
        }
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (
          event.defaultPrevented ||
          event.pointerType === "touch" ||
          event.buttons !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }
        hovered.current = true;
        scheduleIntent(event.currentTarget);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        hovered.current = false;
        if (!focused.current) cancelIntent();
      }}
      prefetch={
        prefetch === "intent" ? (intentDestination === destinationKey ? true : "auto") : prefetch
      }
    />
  );
}

export default Link;
