/**
 * Better Auth builds verification URLs as `${baseURL}/verify-email?...`.
 * The Next.js handler lives at `/api/auth/*`, so rewrite the path when needed.
 */
export const resolvePublicEmailVerificationUrl = (
  verificationUrlFromAuth: string
): string => {
  const url = new URL(verificationUrlFromAuth)
  if (url.pathname === "/verify-email") {
    url.pathname = "/api/auth/verify-email"
  }
  return url.toString()
}
