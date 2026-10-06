"use client";

import type { ClientSessionState } from "eve/client";

const STORAGE_KEY = "template-eve-chat-v1";

interface StoredChat {
  input: string;
  session?: ClientSessionState;
  turnActive?: boolean;
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
      turnActive: stored?.turnActive === true,
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
