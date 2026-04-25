"use client";

import dynamic from "next/dynamic";

/**
 * AgentPanel is heavy, not needed on the server, so just dynamically load it once hydrated
 */
const AgentPanel = dynamic(() => import("./agent-panel").then((mod) => mod.AgentPanel), {
  ssr: false,
});

export { AgentPanel };
