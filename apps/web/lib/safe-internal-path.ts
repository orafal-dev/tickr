/**
 * Returns a same-origin path for redirects. Rejects protocol-relative and
 * absolute URLs to avoid open redirects.
 */
export const resolveSafeInternalPath = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }
  return value
}
