"use client";

import { useSyncExternalStore } from "react";

type AgentCartStatus = "failed" | "pending" | "ready";

let status: AgentCartStatus = "ready";
const listeners = new Set<() => void>();

export function setAgentCartStatus(value: AgentCartStatus) {
  if (status === value) return;
  status = value;
  for (const listener of listeners) listener();
}

export function useAgentCartStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => status,
    (): AgentCartStatus => "ready",
  );
}

export function useAgentCartPending() {
  return useAgentCartStatus() !== "ready";
}
