"use server";

import { generateText } from "ai";

const TRY_ON_MODEL = "google/gemini-3.1-flash-lite-image";

const TRY_ON_PROMPT = [
  "You are a virtual try-on image generator.",
  "The first image is a photo of a person. The second image is a clothing product.",
  "Generate a single photorealistic image of the same person from the first image wearing the product garment from the second image.",
  "Preserve the person's face, hair, body shape, pose, and background exactly.",
  "Replace whatever they are currently wearing on the relevant body area with the product, matching its color, pattern, fit, drape, lighting, and shadows so the result looks natural.",
  "Output only the resulting image.",
].join(" ");

export type TryOnResult = { image: string; success: true } | { error: string; success: false };

export async function virtualTryOnAction({
  personImage,
  productImageUrl,
}: {
  personImage: string;
  productImageUrl: string;
}): Promise<TryOnResult> {
  if (!personImage || !productImageUrl) {
    return { error: "Missing image input", success: false };
  }

  let productUrl: URL;
  try {
    productUrl = new URL(productImageUrl);
  } catch {
    return { error: "Invalid product image URL", success: false };
  }

  try {
    const result = await generateText({
      model: TRY_ON_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: TRY_ON_PROMPT },
            { type: "image", image: personImage },
            { type: "image", image: productUrl },
          ],
        },
      ],
    });

    const file = result.files.find((f) => f.mediaType?.startsWith("image/"));
    if (!file) {
      return { error: "The model did not return an image", success: false };
    }

    return { image: `data:${file.mediaType};base64,${file.base64}`, success: true };
  } catch (error) {
    console.error("Virtual try-on failed:", error);
    return {
      error: error instanceof Error ? error.message : "Virtual try-on failed",
      success: false,
    };
  }
}
