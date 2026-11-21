import { defineAgent } from "eve";

export default defineAgent({
  defaultTools: false,
  model: "openai/gpt-6-luna-fast",
});
