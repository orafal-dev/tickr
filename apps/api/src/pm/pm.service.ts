import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Pool, PoolClient } from "pg"

import { DATABASE_POOL } from "../database/database.tokens"
import { OrganizationAccessService } from "./organization-access.service"
import type {
  CreateCommentBody,
  CreateIssueBody,
  CreateLabelBody,
  CreateProjectBody,
  ListIssuesQuery,
  ReorderStatusesBody,
  UpdateIssueBody,
  UpdateLabelBody,
  UpdateProjectBody,
} from "./pm.request.types"

const defaultStatusRows: ReadonlyArray<readonly [string, number, string]> = [
  ["Backlog", 0, "backlog"],
  ["Todo", 1, "unstarted"],
  ["In progress", 2, "started"],
  ["Done", 3, "completed"],
  ["Canceled", 4, "canceled"],
]

@Injectable()
export class PmService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly organizationAccess: OrganizationAccessService
  ) {}

  /**
   * Issue descriptions are stored as TEXT (TipTap JSON string). Some drivers or
   * column types may surface values as objects; clients always expect a string.
   */
  private normalizeIssueDescription(value: unknown): string {
    if (value === null || value === undefined) {
      return ""
    }
    if (typeof value === "string") {
      return value
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value)
      } catch {
        return ""
      }
    }
    return String(value)
  }

  private mapIssueRow(row: Record<string, unknown>): unknown {
    return {
      ...row,
      description: this.normalizeIssueDescription(row.description),
    }
  }

  async getWorkspaceMeta(organizationId: string): Promise<{
    readonly organizationSlug: string | null
  }> {
    const organizationSlug =
      await this.organizationAccess.getOrganizationSlug(organizationId)
    return { organizationSlug }
  }

  private buildStatusInsertQuery(): string {
    const tuples: string[] = []
    const base = 2
    for (let i = 0; i < defaultStatusRows.length; i += 1) {
      const offset = base + i * 3
      tuples.push(`($1, $${offset}, $${offset + 1}, $${offset + 2})`)
    }
    return `insert into pm_issue_status (organization_id, name, position, category)
            values ${tuples.join(", ")}`
  }

  private async ensureDefaultStatuses(organizationId: string): Promise<void> {
    const countRes = await this.pool.query<{ c: number }>(
      "select count(*)::int as c from pm_issue_status where organization_id = $1",
      [organizationId]
    )
    const existing = countRes.rows[0]?.c ?? 0
    if (existing > 0) {
      return
    }
    const params: unknown[] = [organizationId]
    for (const row of defaultStatusRows) {
      params.push(row[0], row[1], row[2])
    }
    await this.pool.query(this.buildStatusInsertQuery(), params)
  }

  async listStatuses(organizationId: string): Promise<unknown[]> {
    await this.ensureDefaultStatuses(organizationId)
    const res = await this.pool.query(
      `select id, name, position, category, created_at as "createdAt"
       from pm_issue_status
       where organization_id = $1
       order by position asc, name asc`,
      [organizationId]
    )
    return res.rows
  }

  async reorderStatuses(
    organizationId: string,
    body: ReorderStatusesBody
  ): Promise<unknown[]> {
    await this.ensureDefaultStatuses(organizationId)
    const orderedIds = body.orderedIds
    const res = await this.pool.query<{ id: string }>(
      `select id from pm_issue_status
       where organization_id = $1`,
      [organizationId]
    )
    const existing = new Set(res.rows.map((row) => row.id))
    if (orderedIds.length !== existing.size) {
      throw new BadRequestException(
        "orderedIds must list every status exactly once."
      )
    }
    for (const id of orderedIds) {
      if (!existing.has(id)) {
        throw new BadRequestException("Unknown status id in orderedIds.")
      }
    }
    const client = await this.pool.connect()
    try {
      await client.query("begin")
      for (let i = 0; i < orderedIds.length; i += 1) {
        await client.query(
          `update pm_issue_status
           set position = $3
           where organization_id = $1 and id = $2`,
          [organizationId, orderedIds[i], i]
        )
      }
      await client.query("commit")
    } catch (error) {
      await client.query("rollback")
      throw error
    } finally {
      client.release()
    }
    return this.listStatuses(organizationId)
  }

  async listLabels(organizationId: string): Promise<unknown[]> {
    const res = await this.pool.query(
      `select id, name, color, created_at as "createdAt"
       from pm_label
       where organization_id = $1
       order by name asc`,
      [organizationId]
    )
    return res.rows
  }

  async createLabel(
    organizationId: string,
    body: CreateLabelBody
  ): Promise<unknown> {
    const color = body.color ?? "#6B7280"
    const res = await this.pool.query(
      `insert into pm_label (organization_id, name, color)
       values ($1, $2, $3)
       returning id, name, color, created_at as "createdAt"`,
      [organizationId, body.name, color]
    )
    return res.rows[0]
  }

  async updateLabel(
    organizationId: string,
    labelId: string,
    body: UpdateLabelBody
  ): Promise<unknown> {
    const res = await this.pool.query(
      `update pm_label
       set name = coalesce($3, name),
           color = coalesce($4, color)
       where id = $2 and organization_id = $1
       returning id, name, color, created_at as "createdAt"`,
      [organizationId, labelId, body.name ?? null, body.color ?? null]
    )
    if (res.rowCount === 0) {
      throw new NotFoundException("Label not found.")
    }
    return res.rows[0]
  }

  async deleteLabel(organizationId: string, labelId: string): Promise<void> {
    const res = await this.pool.query(
      "delete from pm_label where id = $2 and organization_id = $1",
      [organizationId, labelId]
    )
    if (res.rowCount === 0) {
      throw new NotFoundException("Label not found.")
    }
  }

  async listProjects(organizationId: string): Promise<unknown[]> {
    const res = await this.pool.query(
      `select id, name, description, status,
              created_at as "createdAt", updated_at as "updatedAt"
       from pm_project
       where organization_id = $1
       order by updated_at desc`,
      [organizationId]
    )
    return res.rows
  }

  async createProject(
    organizationId: string,
    body: CreateProjectBody
  ): Promise<unknown> {
    const status = body.status ?? "active"
    const description = body.description ?? ""
    const res = await this.pool.query(
      `insert into pm_project (organization_id, name, description, status)
       values ($1, $2, $3, $4)
       returning id, name, description, status,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [organizationId, body.name, description, status]
    )
    return res.rows[0]
  }

  async updateProject(
    organizationId: string,
    projectId: string,
    body: UpdateProjectBody
  ): Promise<unknown> {
    const res = await this.pool.query(
      `update pm_project
       set name = coalesce($3, name),
           description = coalesce($4, description),
           status = coalesce($5, status),
           updated_at = now()
       where id = $2 and organization_id = $1
       returning id, name, description, status,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        organizationId,
        projectId,
        body.name ?? null,
        body.description ?? null,
        body.status ?? null,
      ]
    )
    if (res.rowCount === 0) {
      throw new NotFoundException("Project not found.")
    }
    return res.rows[0]
  }

  async listIssues(
    organizationId: string,
    query: ListIssuesQuery
  ): Promise<unknown[]> {
    await this.ensureDefaultStatuses(organizationId)
    const includeArchived = query.includeArchived === true
    const params: unknown[] = [organizationId]
    let p = 2
    const clauses: string[] = ["i.organization_id = $1"]
    if (!includeArchived) {
      clauses.push("i.archived_at is null")
    }
    if (query.statusId) {
      clauses.push(`i.status_id = $${p}`)
      params.push(query.statusId)
      p += 1
    }
    if (query.projectId) {
      clauses.push(`i.project_id = $${p}`)
      params.push(query.projectId)
      p += 1
    }
    if (query.assigneeId) {
      clauses.push(
        `exists (select 1 from pm_issue_assignee ia
                 where ia.issue_id = i.id and ia.user_id = $${p})`
      )
      params.push(query.assigneeId)
      p += 1
    }
    if (query.labelId) {
      clauses.push(
        `exists (select 1 from pm_issue_label il
                 where il.issue_id = i.id and il.label_id = $${p})`
      )
      params.push(query.labelId)
      p += 1
    }
    if (query.q && query.q.length > 0) {
      const escaped = `%${query.q.replace(/[%_]/g, "\\$&")}%`
      clauses.push(
        `(i.title ilike $${p} escape '\\' or i.description ilike $${p} escape '\\')`
      )
      params.push(escaped)
      p += 1
    }
    params.push(query.limit, query.offset)
    const limitParam = p
    const offsetParam = p + 1
    const sql = `select i.id,
                        i.issue_number as "issueNumber",
                        i.title,
                        i.description,
                        i.priority,
                        i.archived_at as "archivedAt",
                        i.created_at as "createdAt",
                        i.updated_at as "updatedAt",
                        i.created_by_user_id as "createdByUserId",
                        i.status_id as "statusId",
                        i.project_id as "projectId",
                        s.name as "statusName",
                        s.category as "statusCategory",
                        p.name as "projectName"
                 from pm_issue i
                 join pm_issue_status s on s.id = i.status_id
                 left join pm_project p on p.id = i.project_id
                 where ${clauses.join(" and ")}
                 order by i.updated_at desc
                 limit $${limitParam} offset $${offsetParam}`
    const res = await this.pool.query(sql, params)
    return res.rows.map((row) =>
      this.mapIssueRow(row as Record<string, unknown>)
    )
  }

  private async resolveDefaultStatusId(
    client: Pool | PoolClient,
    organizationId: string
  ): Promise<string> {
    const res = await client.query<{ id: string }>(
      `select id from pm_issue_status
       where organization_id = $1
       order by position asc, name asc
       limit 1`,
      [organizationId]
    )
    const id = res.rows[0]?.id
    if (!id) {
      throw new BadRequestException(
        "No workflow statuses exist for this organization."
      )
    }
    return id
  }

  private async assertProjectInOrg(
    client: Pool | PoolClient,
    organizationId: string,
    projectId: string
  ): Promise<void> {
    const res = await client.query(
      "select 1 from pm_project where id = $2 and organization_id = $1 limit 1",
      [organizationId, projectId]
    )
    if (res.rowCount === 0) {
      throw new BadRequestException(
        "Project does not belong to this organization."
      )
    }
  }

  private async assertLabelsInOrg(
    client: Pool | PoolClient,
    organizationId: string,
    labelIds: readonly string[]
  ): Promise<void> {
    if (labelIds.length === 0) {
      return
    }
    const res = await client.query<{ c: number }>(
      `select count(*)::int as c
       from pm_label
       where organization_id = $1
         and id = any($2::uuid[])`,
      [organizationId, labelIds]
    )
    const count = res.rows[0]?.c ?? 0
    if (count !== labelIds.length) {
      throw new BadRequestException(
        "One or more labels are invalid for this organization."
      )
    }
  }

  private async notifyUsers(
    client: PoolClient,
    organizationId: string,
    recipients: ReadonlySet<string>,
    input: Readonly<{
      type: string
      issueId: string
      title: string
      body: string | null
    }>
  ): Promise<void> {
    for (const userId of recipients) {
      await client.query(
        `insert into pm_notification
         (organization_id, user_id, type, issue_id, title, body)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          userId,
          input.type,
          input.issueId,
          input.title,
          input.body,
        ]
      )
    }
  }

  async createIssue(
    organizationId: string,
    actorUserId: string,
    body: CreateIssueBody
  ): Promise<unknown> {
    await this.ensureDefaultStatuses(organizationId)
    const assigneeIds = body.assigneeIds ?? []
    await this.organizationAccess.assertAllAreMembers(
      organizationId,
      assigneeIds
    )
    const labelIds = body.labelIds ?? []
    const client = await this.pool.connect()
    try {
      await client.query("begin")
      if (body.projectId) {
        await this.assertProjectInOrg(client, organizationId, body.projectId)
      }
      await this.assertLabelsInOrg(client, organizationId, labelIds)
      const statusId =
        body.statusId ??
        (await this.resolveDefaultStatusId(client, organizationId))
      if (body.statusId) {
        const statusOk = await client.query(
          "select 1 from pm_issue_status where id = $2 and organization_id = $1",
          [organizationId, statusId]
        )
        if (statusOk.rowCount === 0) {
          throw new BadRequestException("Invalid status for this organization.")
        }
      }
      const numberRes = await client.query<{ issue_number: number }>(
        `insert into pm_issue_counter as c (organization_id, last_number)
         values ($1, 1)
         on conflict (organization_id)
         do update set last_number = c.last_number + 1
         returning last_number as issue_number`,
        [organizationId]
      )
      const issueNumber = numberRes.rows[0]?.issue_number
      if (issueNumber === undefined) {
        throw new BadRequestException("Unable to allocate issue number.")
      }
      const priority = body.priority ?? "none"
      const description = body.description ?? ""
      const issueRes = await client.query(
        `insert into pm_issue
         (organization_id, issue_number, title, description, status_id, project_id, priority, created_by_user_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id,
                   issue_number as "issueNumber",
                   title,
                   description,
                   priority,
                   archived_at as "archivedAt",
                   created_at as "createdAt",
                   updated_at as "updatedAt",
                   created_by_user_id as "createdByUserId",
                   status_id as "statusId",
                   project_id as "projectId"`,
        [
          organizationId,
          issueNumber,
          body.title,
          description,
          statusId,
          body.projectId ?? null,
          priority,
          actorUserId,
        ]
      )
      const issue = issueRes.rows[0] as { id: string; issueNumber: number }
      for (const labelId of labelIds) {
        await client.query(
          "insert into pm_issue_label (issue_id, label_id) values ($1, $2)",
          [issue.id, labelId]
        )
      }
      for (const userId of assigneeIds) {
        await client.query(
          "insert into pm_issue_assignee (issue_id, user_id) values ($1, $2)",
          [issue.id, userId]
        )
      }
      const recipients = new Set(assigneeIds)
      recipients.delete(actorUserId)
      await this.notifyUsers(client, organizationId, recipients, {
        type: "issue.assigned",
        issueId: issue.id,
        title: `You were assigned to ${body.title}`,
        body: null,
      })
      await client.query("commit")
      return this.mapIssueRow(issueRes.rows[0] as Record<string, unknown>)
    } catch (error) {
      await client.query("rollback")
      throw error
    } finally {
      client.release()
    }
  }

  async getIssue(organizationId: string, issueId: string): Promise<unknown> {
    const issueRes = await this.pool.query(
      `select i.id,
              i.issue_number as "issueNumber",
              i.title,
              i.description,
              i.priority,
              i.archived_at as "archivedAt",
              i.created_at as "createdAt",
              i.updated_at as "updatedAt",
              i.created_by_user_id as "createdByUserId",
              i.status_id as "statusId",
              i.project_id as "projectId",
              s.name as "statusName",
              s.category as "statusCategory",
              p.name as "projectName"
       from pm_issue i
       join pm_issue_status s on s.id = i.status_id
       left join pm_project p on p.id = i.project_id
       where i.id = $2 and i.organization_id = $1`,
      [organizationId, issueId]
    )
    if (issueRes.rowCount === 0) {
      throw new NotFoundException("Issue not found.")
    }
    const labelsRes = await this.pool.query(
      `select l.id, l.name, l.color
       from pm_label l
       join pm_issue_label il on il.label_id = l.id
       where il.issue_id = $1 and l.organization_id = $2`,
      [issueId, organizationId]
    )
    const assigneesRes = await this.pool.query(
      `select user_id as "userId"
       from pm_issue_assignee
       where issue_id = $1`,
      [issueId]
    )
    return {
      issue: this.mapIssueRow(issueRes.rows[0] as Record<string, unknown>),
      labels: labelsRes.rows,
      assignees: assigneesRes.rows,
    }
  }

  async updateIssue(
    organizationId: string,
    issueId: string,
    actorUserId: string,
    body: UpdateIssueBody
  ): Promise<unknown> {
    const existingAssigneesRes = await this.pool.query<{ user_id: string }>(
      "select user_id from pm_issue_assignee where issue_id = $1",
      [issueId]
    )
    const previousAssignees = new Set(
      existingAssigneesRes.rows.map((row) => row.user_id)
    )
    const client = await this.pool.connect()
    try {
      await client.query("begin")
      const issueCheck = await client.query(
        "select id, title from pm_issue where id = $2 and organization_id = $1 for update",
        [organizationId, issueId]
      )
      if (issueCheck.rowCount === 0) {
        throw new NotFoundException("Issue not found.")
      }
      const issueTitle = String(issueCheck.rows[0].title ?? "Issue")
      if (body.assigneeIds) {
        await this.organizationAccess.assertAllAreMembers(
          organizationId,
          body.assigneeIds
        )
      }
      if (body.projectId !== undefined && body.projectId !== null) {
        await this.assertProjectInOrg(client, organizationId, body.projectId)
      }
      if (body.labelIds) {
        await this.assertLabelsInOrg(client, organizationId, body.labelIds)
      }
      if (body.statusId) {
        const statusOk = await client.query(
          "select 1 from pm_issue_status where id = $2 and organization_id = $1",
          [organizationId, body.statusId]
        )
        if (statusOk.rowCount === 0) {
          throw new BadRequestException("Invalid status for this organization.")
        }
      }
      const fields: string[] = []
      const params: unknown[] = [organizationId, issueId]
      let p = 3
      if (body.title !== undefined) {
        fields.push(`title = $${p}`)
        params.push(body.title)
        p += 1
      }
      if (body.description !== undefined) {
        fields.push(`description = $${p}`)
        params.push(body.description)
        p += 1
      }
      if (body.statusId !== undefined) {
        fields.push(`status_id = $${p}`)
        params.push(body.statusId)
        p += 1
      }
      if (body.projectId !== undefined) {
        fields.push(`project_id = $${p}`)
        params.push(body.projectId)
        p += 1
      }
      if (body.priority !== undefined) {
        fields.push(`priority = $${p}`)
        params.push(body.priority)
        p += 1
      }
      if (body.archived !== undefined) {
        fields.push(`archived_at = $${p}`)
        params.push(body.archived ? new Date() : null)
        p += 1
      }
      if (fields.length > 0) {
        fields.push("updated_at = now()")
        await client.query(
          `update pm_issue set ${fields.join(", ")}
           where organization_id = $1 and id = $2`,
          params
        )
      }
      if (body.labelIds) {
        await client.query("delete from pm_issue_label where issue_id = $1", [
          issueId,
        ])
        for (const labelId of body.labelIds) {
          await client.query(
            "insert into pm_issue_label (issue_id, label_id) values ($1, $2)",
            [issueId, labelId]
          )
        }
      }
      if (body.assigneeIds) {
        await client.query(
          "delete from pm_issue_assignee where issue_id = $1",
          [issueId]
        )
        for (const userId of body.assigneeIds) {
          await client.query(
            "insert into pm_issue_assignee (issue_id, user_id) values ($1, $2)",
            [issueId, userId]
          )
        }
        const nextSet = new Set(body.assigneeIds)
        const newlyAssigned: string[] = []
        for (const id of nextSet) {
          if (!previousAssignees.has(id)) {
            newlyAssigned.push(id)
          }
        }
        const notifySet = new Set(newlyAssigned)
        notifySet.delete(actorUserId)
        await this.notifyUsers(client, organizationId, notifySet, {
          type: "issue.assigned",
          issueId,
          title: `You were assigned to ${issueTitle}`,
          body: null,
        })
      }
      await client.query("commit")
    } catch (error) {
      await client.query("rollback")
      throw error
    } finally {
      client.release()
    }
    const detail = await this.getIssue(organizationId, issueId)
    return (detail as { issue: unknown }).issue
  }

  async listComments(
    organizationId: string,
    issueId: string
  ): Promise<unknown[]> {
    const issueOk = await this.pool.query(
      "select 1 from pm_issue where id = $2 and organization_id = $1",
      [organizationId, issueId]
    )
    if (issueOk.rowCount === 0) {
      throw new NotFoundException("Issue not found.")
    }
    const res = await this.pool.query(
      `select id, body, author_user_id as "authorUserId", created_at as "createdAt"
       from pm_issue_comment
       where issue_id = $1
       order by created_at asc`,
      [issueId]
    )
    return res.rows
  }

  async createComment(
    organizationId: string,
    issueId: string,
    authorUserId: string,
    body: CreateCommentBody
  ): Promise<unknown> {
    const issueRes = await this.pool.query<{
      id: string
      title: string
      created_by_user_id: string
    }>(
      `select id, title, created_by_user_id
       from pm_issue
       where id = $2 and organization_id = $1`,
      [organizationId, issueId]
    )
    const row = issueRes.rows[0]
    if (!row) {
      throw new NotFoundException("Issue not found.")
    }
    const client = await this.pool.connect()
    try {
      await client.query("begin")
      const insertRes = await client.query(
        `insert into pm_issue_comment (issue_id, author_user_id, body)
         values ($1, $2, $3)
         returning id, body, author_user_id as "authorUserId", created_at as "createdAt"`,
        [issueId, authorUserId, body.body]
      )
      const assigneesRes = await client.query<{ user_id: string }>(
        "select user_id from pm_issue_assignee where issue_id = $1",
        [issueId]
      )
      const recipients = new Set<string>()
      for (const assignee of assigneesRes.rows) {
        recipients.add(assignee.user_id)
      }
      recipients.add(row.created_by_user_id)
      recipients.delete(authorUserId)
      await this.notifyUsers(client, organizationId, recipients, {
        type: "issue.comment",
        issueId,
        title: `New comment on ${row.title}`,
        body: body.body,
      })
      await client.query("commit")
      return insertRes.rows[0]
    } catch (error) {
      await client.query("rollback")
      throw error
    } finally {
      client.release()
    }
  }

  async listNotifications(
    organizationId: string,
    userId: string
  ): Promise<unknown[]> {
    const res = await this.pool.query(
      `select id, type, issue_id as "issueId", title, body,
              read_at as "readAt", created_at as "createdAt"
       from pm_notification
       where organization_id = $1 and user_id = $2
       order by created_at desc
       limit 100`,
      [organizationId, userId]
    )
    return res.rows
  }

  async markNotificationRead(
    organizationId: string,
    userId: string,
    notificationId: string
  ): Promise<void> {
    const res = await this.pool.query(
      `update pm_notification
       set read_at = now()
       where id = $3 and organization_id = $1 and user_id = $2`,
      [organizationId, userId, notificationId]
    )
    if (res.rowCount === 0) {
      throw new NotFoundException("Notification not found.")
    }
  }

  async markAllNotificationsRead(
    organizationId: string,
    userId: string
  ): Promise<void> {
    await this.pool.query(
      `update pm_notification
       set read_at = now()
       where organization_id = $1 and user_id = $2 and read_at is null`,
      [organizationId, userId]
    )
  }
}
