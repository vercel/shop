/**
 * Debounce delay for cart quantity updates.
 * First click fires immediately (leading edge), subsequent clicks within
 * this window are batched and sent after the delay (trailing edge).
 */
export const DEBOUNCE_MS = 400;
