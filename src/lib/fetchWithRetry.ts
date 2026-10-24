/**
 * Wraps fetch with automatic retry + exponential backoff. Instead of
 * surfacing the first network hiccup as a hard error, it quietly retries
 * a couple of times — and if it's STILL not back by the time a retry
 * fires, the caller gets an onSlow() callback to show a "this is taking
 * longer than expected" message rather than going straight to an error
 * screen. Only gives up (throws) after all retries are exhausted.
 */
export interface RetryOptions {
  retries?: number; // default 3
  baseDelayMs?: number; // default 800ms, doubles each retry
  onSlow?: () => void; // fired once, right before the first retry
  onRetry?: (attempt: number) => void;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: RetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 800, onSlow, onRetry } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      // Retry on server errors (5xx) and 429 (rate limit), but not on
      // normal 4xx client errors (those won't succeed on retry).
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`Server returned ${res.status}`);
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt === 0 && onSlow) onSlow();
      if (attempt < retries) {
        onRetry?.(attempt + 1);
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed after retries");
}

/**
 * Same idea, wrapping a Supabase-style async call (anything returning
 * {data, error}) instead of a raw fetch — used for direct Supabase client
 * calls (.insert(), .select(), etc.) which don't go through fetchWithRetry.
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T; error: { message: string } | null }>,
  opts: RetryOptions = {}
): Promise<{ data: T; error: { message: string } | null }> {
  const { retries = 2, baseDelayMs = 800, onSlow, onRetry } = opts;
  let result = await fn();

  for (let attempt = 0; attempt < retries && result.error; attempt++) {
    if (attempt === 0 && onSlow) onSlow();
    onRetry?.(attempt + 1);
    await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    result = await fn();
  }
  return result;
}
