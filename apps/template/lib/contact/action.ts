"use server";

export interface ContactActionState {
  error?: "invalid" | "submit";
  success: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 50;

function getField(formData: FormData, name: string, maxLength: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function submitContactAction(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const body = getField(formData, "body", MAX_MESSAGE_LENGTH);
  const email = getField(formData, "email", MAX_EMAIL_LENGTH);
  const name = getField(formData, "name", MAX_NAME_LENGTH);
  const phone = getField(formData, "phone", MAX_PHONE_LENGTH);

  if (!body || !EMAIL_PATTERN.test(email)) {
    return { error: "invalid", success: false };
  }

  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!storeDomain) {
    console.error("Contact form submission failed: Shopify store domain is not configured");
    return { error: "submit", success: false };
  }

  const payload = new URLSearchParams({
    "contact[body]": body,
    "contact[email]": email,
    form_type: "contact",
    utf8: "✓",
  });

  if (name) payload.set("contact[name]", name);
  if (phone) payload.set("contact[phone]", phone);

  try {
    const response = await fetch(new URL("/contact", `https://${storeDomain}`), {
      body: payload,
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      redirect: "manual",
    });

    if (response.status >= 400) {
      console.error(`Contact form submission failed with status ${response.status}`);
      return { error: "submit", success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return { error: "submit", success: false };
  }
}
