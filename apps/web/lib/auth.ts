import "server-only"

import { headers } from "next/headers"

import { auth } from "@/lib/better-auth-instance"

export { auth }

export const getSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}
