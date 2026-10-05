import type { LogLevel } from "@shopify/hydrogen";

export type WritableLogLevel = Exclude<LogLevel, "silent">;
