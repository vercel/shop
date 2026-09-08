"use client";

import NextLink from "next/link";
import { type ComponentProps, useEffect, useRef, useState } from "react";

const INTENT_DELAY_MS = 100;

interface LinkProps extends Omit<
  ComponentProps<typeof NextLink>,
  "legacyBehavior" | "prefetch" | "unstable_dynamicOnHover"
> {
  prefetch?: ComponentProps<typeof NextLink>["prefetch"] | "intent";
}

interface Connection extends EventTarget {
  saveData?: boolean;
}

interface Intent {
  anchor: HTMLAnchorElement;
  id: number;
}

let cancelCurrentIntent: (() => void) | undefined;
let latestIntent = 0;

function retireIntent() {
  cancelCurrentIntent?.();
  return ++latestIntent;
}

function canUpgrade(anchor: HTMLAnchorElement, connection: Connection | undefined): boolean {
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
    const destination = new URL(anchor.href);
    const current = new URL(window.location.href);
    return (
      (destination.protocol === "https:" || destination.protocol === "http:") &&
      destination.origin === current.origin &&
      (destination.pathname !== current.pathname || destination.search !== current.search)
    );
  } catch {
    return false;
  }
}

function scheduleIntent(anchor: HTMLAnchorElement, activate: () => void, deactivate: () => void) {
  cancelCurrentIntent?.();
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  if (!canUpgrade(anchor, connection)) return undefined;

  const destination = anchor.href;
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", checkEligibility);
    window.removeEventListener("offline", dismiss);
    window.removeEventListener("blur", dismiss);
    connection?.removeEventListener("change", checkEligibility);
    if (cancelCurrentIntent === cancel) cancelCurrentIntent = undefined;
    deactivate();
  };
  const dismiss = () => {
    if (cancelCurrentIntent === cancel) retireIntent();
  };
  const checkEligibility = () => {
    if (!canUpgrade(anchor, connection)) dismiss();
  };
  const timer = setTimeout(() => {
    if (anchor.href !== destination || !canUpgrade(anchor, connection)) {
      cancel();
      return;
    }
    activate();
  }, INTENT_DELAY_MS);

  cancelCurrentIntent = cancel;
  document.addEventListener("visibilitychange", checkEligibility);
  window.addEventListener("offline", dismiss);
  window.addEventListener("blur", dismiss);
  connection?.addEventListener("change", checkEligibility);
  return cancel;
}

export function Link({
  as,
  download,
  href,
  onBlur,
  onFocus,
  onPointerCancel,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  prefetch = "intent",
  target,
  ...props
}: LinkProps) {
  const destinationKey = JSON.stringify([href, as, download, target]);
  const [activeDestination, setActiveDestination] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const disabled = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const eligible =
    !disabled &&
    (download === undefined || download === false) &&
    (!target || target.toLowerCase() === "_self");

  function cancel() {
    if (intent?.id === latestIntent) retireIntent();
    setIntent(null);
  }

  function begin(anchor: HTMLAnchorElement) {
    const id = retireIntent();
    setIntent(prefetch === "intent" && eligible ? { anchor, id } : null);
  }

  useEffect(() => {
    if (!intent || intent.id !== latestIntent || prefetch !== "intent" || !eligible) return;
    return scheduleIntent(
      intent.anchor,
      () => setActiveDestination(destinationKey),
      () => setActiveDestination(null),
    );
  }, [destinationKey, eligible, intent, prefetch]);

  return (
    <NextLink
      {...props}
      as={as}
      download={download}
      href={href}
      onBlur={(event) => {
        onBlur?.(event);
        focused.current = false;
        if (!hovered.current) cancel();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented || !event.currentTarget.matches(":focus-visible")) {
          retireIntent();
          cancel();
          return;
        }
        focused.current = true;
        begin(event.currentTarget);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        hovered.current = false;
        focused.current = false;
        cancel();
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
          focused.current = false;
          retireIntent();
          cancel();
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
          retireIntent();
          cancel();
          return;
        }
        hovered.current = true;
        begin(event.currentTarget);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        hovered.current = false;
        if (!focused.current) cancel();
      }}
      prefetch={
        prefetch === "intent"
          ? eligible
            ? activeDestination === destinationKey
              ? true
              : null
            : false
          : prefetch
      }
      target={target}
    />
  );
}

export default Link;
