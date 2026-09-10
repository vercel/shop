import { defineAgent } from "eve";

export default defineAgent({
  limits: {
    maxInputTokensPerSession: 100_000,
    maxOutputTokensPerSession: 10_000,
    sessionTimeoutMs: 86_400_000,
  },
  model: "openai/gpt-5.6-luna",
});
