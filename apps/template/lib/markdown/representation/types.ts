export interface AcceptEntry {
  position: number;
  quality: number;
  specificity: number;
  type: string;
}

export type Representation = "text/html" | "text/markdown";

export type NegotiatedRepresentation = Representation | null;
