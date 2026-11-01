import { defineAgent } from "eve";

export default defineAgent({
  defaultTools: false,
  // Anonymous sessions have the unknown audience, whose derived retention deletes run data and breaks chat restore.
  experimental: { workflow: { retention: "default" } },
  model: "openai/gpt-6-luna-fast",
});
