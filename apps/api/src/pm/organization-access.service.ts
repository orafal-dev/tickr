import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
} from "@nestjs/common"
import type { Pool } from "pg"

import { DATABASE_POOL } from "../database/database.tokens"

type ColumnStyle = "camel" | "snake"

/**
 * Validates Better Auth organization membership and resolves org metadata.
 * Detects whether the Better Auth `member` table uses camelCase or snake_case columns.
 */
@Injectable()
export class OrganizationAccessService implements OnModuleInit {
  private columnStyle: ColumnStyle | null = null

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    this.columnStyle = await this.detectMemberColumnStyle()
  }

  private async detectMemberColumnStyle(): Promise<ColumnStyle> {
    const res = await this.pool.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'member'
         and column_name in ('organizationId', 'organization_id')
       limit 1`
    )
    const columnName = res.rows[0]?.column_name
    if (columnName === "organization_id") {
      return "snake"
    }
    return "camel"
  }

  private getColumnStyle(): ColumnStyle {
    if (!this.columnStyle) {
      throw new Error("Member column style was not initialized.")
    }
    return this.columnStyle
  }

  async assertIsMember(userId: string, organizationId: string): Promise<void> {
    const style = this.getColumnStyle()
    const sql =
      style === "snake"
        ? "select 1 from member where organization_id = $1 and user_id = $2 limit 1"
        : 'select 1 from member where "organizationId" = $1 and "userId" = $2 limit 1'
    const res = await this.pool.query(sql, [organizationId, userId])
    if (res.rowCount === 0) {
      throw new ForbiddenException("User is not a member of this organization.")
    }
  }

  async countMembersInOrganization(
    organizationId: string,
    userIds: readonly string[]
  ): Promise<number> {
    if (userIds.length === 0) {
      return 0
    }
    const style = this.getColumnStyle()
    const sql =
      style === "snake"
        ? `select count(*)::int as c
           from member
           where organization_id = $1
             and user_id = any($2::text[])`
        : `select count(*)::int as c
           from member
           where "organizationId" = $1
             and "userId" = any($2::text[])`
    const res = await this.pool.query<{ c: number }>(sql, [
      organizationId,
      userIds,
    ])
    return res.rows[0]?.c ?? 0
  }

  async assertAllAreMembers(
    organizationId: string,
    userIds: readonly string[]
  ): Promise<void> {
    if (userIds.length === 0) {
      return
    }
    const count = await this.countMembersInOrganization(organizationId, userIds)
    if (count !== userIds.length) {
      throw new BadRequestException(
        "One or more assignees are not members of this organization."
      )
    }
  }

  async getOrganizationSlug(organizationId: string): Promise<string | null> {
    const res = await this.pool.query<{ slug: string }>(
      "select slug from organization where id = $1 limit 1",
      [organizationId]
    )
    return res.rows[0]?.slug ?? null
  }
}
