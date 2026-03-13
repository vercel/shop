import type { CmsRichText } from "@/lib/types";

export function createRichTextDocument(paragraphs: string[]): CmsRichText {
  return {
    type: "root",
    children: paragraphs.map((paragraph) => ({
      type: "paragraph",
      children: [{ type: "text", value: paragraph }],
    })),
  };
}
