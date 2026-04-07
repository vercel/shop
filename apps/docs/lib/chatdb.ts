import type { UIMessage } from "ai";
import Dexie, { type EntityTable } from "dexie";

interface StoredMessage extends UIMessage {
  timestamp: number;
  sequence: number;
}

class ChatDatabase extends Dexie {
  messages!: EntityTable<StoredMessage, "id">;

  constructor() {
    super("shopDocs");
    this.version(1).stores({
      messages: "id, timestamp, sequence",
    });
  }
}

export const db = new ChatDatabase();
