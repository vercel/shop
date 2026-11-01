"use client";

import { useSyncExternalStore } from "react";

let pending = false;
const listeners = new Set<() => void>();

export function setAgentCartPending(value: boolean) {
  if (pending === value) return;
  pending = value;
  for (const listener of listeners) listener();
}

export function useAgentCartPending() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => pending,
    () => false,
  );
}
