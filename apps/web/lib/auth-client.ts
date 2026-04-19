import { dashClient, sentinelClient } from "@better-auth/infra/client"
import { organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { z } from "zod"

const publicAppUrlSchema = z.string().url()

const resolveBaseURL = (): string => {
  // In the browser, always use the page origin. Preferring env over `window`
  // breaks auth when `.env` says `http://localhost:3000` but the app is opened
  // at `http://127.0.0.1:3000` (different origin → CORS / "Failed to fetch").
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  const fromEnv = publicAppUrlSchema.safeParse(process.env.NEXT_PUBLIC_APP_URL)
  if (fromEnv.success) {
    return fromEnv.data
  }
  return "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [
    dashClient(),
    sentinelClient({
      autoSolveChallenge: true,
    }),
    organizationClient(),
  ],
})
