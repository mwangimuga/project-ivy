/**
 * Supabase's query errors (PostgrestError, from .insert()/.update()/.delete())
 * are plain objects — { message, details, hint, code } — not actual
 * `Error` instances. `e instanceof Error` is always false for them, which
 * silently discards the real, useful message (an RLS violation, a check
 * constraint failure, a missing column) in favor of a generic fallback.
 * This handles both real Errors and Supabase's plain-object errors.
 */
export function getErrorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  if (typeof e === "string") return e;
  return fallback;
}
