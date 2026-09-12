export async function runCommerce<T>(execute: () => Promise<T>) {
  try {
    return await execute();
  } catch {
    return {
      error:
        "Shopping tool could not be confirmed. Inspect the cart before requesting another change; it may already have succeeded.",
    };
  }
}
