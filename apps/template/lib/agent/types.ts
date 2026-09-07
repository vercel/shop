import type { PageContext } from "./routes/types";

export interface AgentContext {
  cartId: string | undefined;
  page: PageContext;
}
