export interface AgentSessionBinding {
  cartId: string;
  shopperId: string;
}

export interface ShopperSession {
  cartId: string;
  expiresAt: number;
  id: string;
}
