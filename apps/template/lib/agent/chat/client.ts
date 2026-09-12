"use client";

import type { ClientSessionState } from "eve/client";
import { type RefObject, useEffect, useEffectEvent, useRef } from "react";

const STORAGE_KEY = "template-eve-chat-v1";

interface StoredChat {
  input: string;
  session?: ClientSessionState;
}

export function readStoredChat(): StoredChat {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      input: typeof stored?.input === "string" ? stored.input : "",
      session:
        typeof stored?.session?.sessionId === "string"
          ? { sessionId: stored.session.sessionId, streamIndex: 0 }
          : undefined,
    };
  } catch {
    return { input: "" };
  }
}

export function writeStoredChat(value: StoredChat) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Chat remains usable without browser storage. */
  }
}

function isAtScrollBoundary(element: HTMLElement, deltaY: number) {
  const { clientHeight, scrollHeight, scrollTop } = element;
  if (deltaY < 0) return scrollTop <= 0;
  if (deltaY > 0) return Math.ceil(scrollTop + clientHeight) >= scrollHeight;
  return false;
}

export function useAgentScrollContain(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const touchStartY = useRef(0);
  const getScroller = () => ref.current?.querySelector<HTMLElement>("[data-slot=agent-messages]");
  const onWheel = useEffectEvent((event: WheelEvent) => {
    const scroller = getScroller();
    if (scroller?.contains(event.target as Node) && !isAtScrollBoundary(scroller, event.deltaY))
      return;
    event.preventDefault();
  });
  const onTouchStart = useEffectEvent((event: TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? 0;
  });
  const onTouchMove = useEffectEvent((event: TouchEvent) => {
    const scroller = getScroller();
    const deltaY = touchStartY.current - (event.touches[0]?.clientY ?? 0);
    if (scroller?.contains(event.target as Node) && !isAtScrollBoundary(scroller, deltaY)) return;
    event.preventDefault();
  });

  useEffect(() => {
    const panel = ref.current;
    if (!enabled || !panel) return;
    panel.addEventListener("wheel", onWheel, { passive: false });
    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      panel.removeEventListener("wheel", onWheel);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled, ref]);
}
