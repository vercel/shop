import { defineContent, extendSchema, z } from "fromsrc";

const docsSchema = extendSchema({
  product: z.string().optional(),
  url: z
    .string()
    .regex(/^\/.*/, { message: "url must start with a slash" })
    .optional(),
  type: z
    .enum([
      "conceptual",
      "guide",
      "reference",
      "troubleshooting",
      "integration",
      "overview",
    ])
    .optional(),
  prerequisites: z
    .array(
      z
        .string()
        .regex(/^\/.*/, { message: "prerequisites must start with a slash" })
    )
    .optional(),
  related: z
    .array(
      z.string().regex(/^\/.*/, { message: "related must start with a slash" })
    )
    .optional(),
  summary: z.string().optional(),
});

export const docs = defineContent({
  dir: "content/docs",
  schema: docsSchema,
});
