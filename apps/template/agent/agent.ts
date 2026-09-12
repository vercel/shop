import { gateway, wrapLanguageModel } from "ai";
import { defineAgent } from "eve";

import { catalogMiddleware } from "./lib/catalog-middleware";

export default defineAgent({
  defaultTools: false,
  limits: {
    maxInputTokensPerSession: 100_000,
    maxOutputTokensPerSession: 10_000,
    sessionTimeoutMs: 86_400_000,
  },
  model: wrapLanguageModel({
    middleware: catalogMiddleware,
    model: gateway("openai/gpt-5.6-luna"),
  }),
  // Eve cannot infer Gateway context limits through the model wrapper.
  modelContextWindowTokens: 1_050_000,
});
