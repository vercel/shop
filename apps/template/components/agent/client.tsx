"use client";

import dynamic from "next/dynamic";

const AgentPanel = dynamic(() => import("./agent-panel").then((mod) => mod.AgentPanel), {
  ssr: false,
});

export { AgentPanel };
