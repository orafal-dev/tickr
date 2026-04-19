import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { OrganizationAccessService } from "./organization-access.service"
import type { PmRequest } from "./pm.types"

@Injectable()
export class PmAuthGuard implements CanActivate {
  constructor(private readonly organizationAccess: OrganizationAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PmRequest>()
    const internalKey = req.headers["x-api-internal-key"]
    const expected =
      process.env.API_INTERNAL_KEY && process.env.API_INTERNAL_KEY.length > 0
        ? process.env.API_INTERNAL_KEY
        : process.env.NODE_ENV === "production"
          ? ""
          : "local-development-api-internal-key"
    if (
      !expected ||
      typeof internalKey !== "string" ||
      internalKey !== expected
    ) {
      throw new UnauthorizedException("Invalid or missing internal API key.")
    }
    const userId = req.headers["x-user-id"]
    const organizationId = req.headers["x-organization-id"]
    if (typeof userId !== "string" || userId.length === 0) {
      throw new UnauthorizedException("Missing x-user-id header.")
    }
    if (typeof organizationId !== "string" || organizationId.length === 0) {
      throw new UnauthorizedException("Missing x-organization-id header.")
    }
    const pmRequest = req as PmRequest
    pmRequest.pmContext = { userId, organizationId }
    await this.organizationAccess.assertIsMember(userId, organizationId)
    return true
  }
}
