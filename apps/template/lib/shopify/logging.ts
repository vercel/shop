import {
  configureLogging,
  type HydrogenLogger,
  type LogContext,
  type LogLevel,
} from "@shopify/hydrogen";

const DEBUG_SHOPIFY = ["1", "true"].includes(process.env.DEBUG_SHOPIFY?.toLowerCase() ?? "");

const CONSOLE_METHODS = {
  debug: "debug",
  error: "error",
  fatal: "error",
  info: "info",
  trace: "debug",
  warn: "warn",
} as const;

type WritableLogLevel = Exclude<LogLevel, "silent">;

function writeLog(level: WritableLogLevel, message: string, context?: LogContext) {
  const { error, scope = "shopify", ...details } = context ?? {};
  const args: unknown[] = [`[shopify:${level}:${scope}] ${message}`];
  if (error !== undefined) args.push(error);
  if (Object.keys(details).length > 0) args.push(details);
  console[CONSOLE_METHODS[level]](...args);
}

export const shopifyLogger: HydrogenLogger = {
  debug: (message, context) => writeLog("debug", message, context),
  error: (message, context) => writeLog("error", message, context),
  fatal: (message, context) => writeLog("fatal", message, context),
  info: (message, context) => writeLog("info", message, context),
  trace: (message, context) => writeLog("trace", message, context),
  warn: (message, context) => writeLog("warn", message, context),
};

export function configureShopifyLogging() {
  configureLogging({
    level: DEBUG_SHOPIFY ? "debug" : "info",
    logger: shopifyLogger,
  });
}

export function logShopifyDebug(message: string, context: LogContext) {
  if (DEBUG_SHOPIFY) shopifyLogger.debug(message, context);
}
