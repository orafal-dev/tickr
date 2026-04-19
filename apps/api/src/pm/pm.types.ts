import type { Request } from "express"

export type PmContext = Readonly<{
  userId: string
  organizationId: string
}>

export type PmRequest = Request & { pmContext?: PmContext }
