import { createParamDecorator, ExecutionContext } from "@nestjs/common"

import type { PmContext, PmRequest } from "./pm.types"

export const PmCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PmContext => {
    const req = ctx.switchToHttp().getRequest<PmRequest>()
    const pmContext = req.pmContext
    if (!pmContext) {
      throw new Error("PM context missing; apply PmAuthGuard to this route.")
    }
    return pmContext
  }
)
