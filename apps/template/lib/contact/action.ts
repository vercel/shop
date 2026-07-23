"use server";

export interface ContactActionState {
  error?: "invalid" | "submit";
  success: boolean;
}

interface StorefrontContactSession {
  contactId: string;
  cookie: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 50;

function addResponseCookies(cookies: Map<string, string>, response: Response): void {
  for (const setCookie of response.headers.getSetCookie()) {
    const pair = setCookie.split(";", 1)[0];
    const separator = pair.indexOf("=");

    if (separator > 0) {
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

function getCookieHeader(cookies: Map<string, string>): string {
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");
}

function getField(formData: FormData, name: string, maxLength: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getContactId(html: string): string {
  const match = html.match(
    /<input\b(?=[^>]*\bname=["']contact\[id\]["'])(?=[^>]*\bvalue=["']([^"']+)["'])[^>]*>/i,
  );

  if (!match) throw new Error("Shopify contact form ID was not found");
  return match[1];
}

async function isPasswordResponse(response: Response, storeUrl: URL): Promise<boolean> {
  const location = response.headers.get("location");
  if (location && new URL(location, storeUrl).pathname === "/password") return true;

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("text/html")) return false;

  const html = await response.clone().text();
  return html.includes('value="storefront_password"');
}

async function getStorefrontContactSession(
  storeUrl: URL,
  password: string,
): Promise<StorefrontContactSession> {
  const cookies = new Map<string, string>();
  const passwordUrl = new URL("/password", storeUrl);
  const passwordPageResponse = await fetch(passwordUrl, {
    cache: "no-store",
    headers: { Accept: "text/html" },
    method: "GET",
    redirect: "manual",
  });

  if (passwordPageResponse.status >= 400) {
    throw new Error(
      `Shopify storefront password page failed with status ${passwordPageResponse.status}`,
    );
  }

  addResponseCookies(cookies, passwordPageResponse);

  const response = await fetch(passwordUrl, {
    body: new URLSearchParams({
      form_type: "storefront_password",
      password,
      utf8: "✓",
    }),
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: getCookieHeader(cookies),
      Origin: storeUrl.origin,
      Referer: passwordUrl.toString(),
    },
    method: "POST",
    redirect: "manual",
  });

  addResponseCookies(cookies, response);
  const cookie = getCookieHeader(cookies);

  if (response.status >= 400 || (await isPasswordResponse(response, storeUrl)) || !cookie) {
    throw new Error(`Shopify storefront authentication failed with status ${response.status}`);
  }

  const verificationResponse = await fetch(new URL("/pages/contact", storeUrl), {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      Cookie: cookie,
    },
    method: "GET",
    redirect: "manual",
  });

  if (
    verificationResponse.status >= 400 ||
    (await isPasswordResponse(verificationResponse, storeUrl))
  ) {
    throw new Error(
      `Shopify storefront session verification failed with status ${verificationResponse.status}`,
    );
  }

  const contactId = getContactId(await verificationResponse.text());
  return { contactId, cookie };
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
  const storefrontPassword = process.env.SHOPIFY_STOREFRONT_PASSWORD;
  if (!storeDomain || !storefrontPassword) {
    console.error("Contact form submission failed: Shopify storefront is not configured");
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
    const storeUrl = new URL(`https://${storeDomain}`);
    const { contactId, cookie } = await getStorefrontContactSession(storeUrl, storefrontPassword);
    payload.set("contact[id]", contactId);

    const response = await fetch(new URL("/contact", storeUrl), {
      body: payload,
      cache: "no-store",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
        Origin: storeUrl.origin,
        Referer: new URL("/pages/contact", storeUrl).toString(),
      },
      method: "POST",
      redirect: "manual",
    });

    if (response.status >= 400 || (await isPasswordResponse(response, storeUrl))) {
      console.error(`Contact form submission failed with status ${response.status}`);
      return { error: "submit", success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return { error: "submit", success: false };
  }
}
