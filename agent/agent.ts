import { gateway, wrapLanguageModel } from "ai";
import { defineAgent } from "eve";

import { catalogMiddleware } from "./lib/catalog-middleware";

export default defineAgent({
  defaultTools: false,
  // Anonymous sessions have the unknown audience, whose derived retention deletes run data and breaks chat restore.
  experimental: { workflow: { retention: "default" } },
  model: wrapLanguageModel({
    middleware: catalogMiddleware,
    model: gateway("openai/gpt-6-luna-fast"),
  }),
  // Eve cannot infer Gateway context limits through the model wrapper.
  modelContextWindowTokens: 1_050_000,
});
