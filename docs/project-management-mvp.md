# Project management (Linear-like) — guidelines

This document captures the **MVP** and **Phase 2** scope for Tickr’s issue and project tracking. The product vocabulary follows common Linear-style patterns; **Better Auth organizations** are the workspace boundary (`x-organization-id` on server-to-server API calls).

## MVP (ship first)

Goal: a usable internal tracker inside an organization.

- **Workspace**: one active Better Auth organization per session; all PM data is scoped by `organization_id`.
- **Issues**: title, description, per-org number, identifier display `{orgSlug}-{number}`, created/updated metadata, creator (`created_by_user_id`), **archived** (soft delete) optional.
- **Status / workflow**: ordered statuses per organization (seed defaults: Backlog, Todo, In progress, Done, Canceled); each maps to a **category** (`backlog`, `unstarted`, `started`, `completed`, `canceled`) for board semantics later.
- **Priority**: `urgent` | `high` | `medium` | `low` | `none`.
- **Assignees**: many-to-many assignees per issue; assignees must be **members** of the organization.
- **Labels**: many-to-many, name + color.
- **Projects**: name, description, lifecycle status (`planned` | `active` | `completed` | `paused`); issues link to **at most one** project (nullable `project_id`).
- **Comments**: thread on an issue (flat list for MVP), author user id, body text, timestamps.
- **Basic search / filters**: list issues with query params: text search (title/description), `status_id`, `project_id`, `label_id`, `assignee_id`, include/exclude archived.
- **In-app notifications**: rows for a user when they are assigned or mentioned is optional for MVP; **assignment** and **new comment** (for assignees + author subscribers simplified: notify assignees + creator on new comment) is implemented minimally.
- **API security**: Nest PM routes require `API_INTERNAL_KEY` plus `x-user-id` and `x-organization-id`; membership is verified against Better Auth’s `member` table (column names are **auto-detected** once: camelCase `organizationId` vs snake_case `organization_id`).

### Operational notes

- Apply SQL migration: `apps/api/db/migrations/001_project_management.sql` (run against the same Postgres as `DATABASE_URL` / Better Auth).
- Configure **web** and **api** with the same `API_INTERNAL_KEY`, and **web** with `API_URL` pointing at the Nest app (default dev port `3001`). For local dev, both apps default the internal key to `local-development-api-internal-key` when the env var is unset (still set it explicitly in production).

### Implemented UI (MVP)

- **Issues**: `/dashboard/issues` (filters, create, list) and `/dashboard/issues/[issueId]` (detail, labels, assignees, comments).
- **Projects**: `/dashboard/projects`.
- **Labels**: `/dashboard/labels`.
- **Notifications**: `/dashboard/notifications`.
- **API**: Nest routes under `/pm/*` (see `apps/api/src/pm/pm.controller.ts`). Next proxies browser calls via `/api/pm/*` using the authenticated session and active organization.

## Phase 2 (after MVP)

- **Cycles / sprints**: start/end, optional capacity, cycle assignment on issues.
- **Relations**: blocks / blocked by, duplicate, relates to (with sensible UX and integrity rules).
- **Roadmaps / timeline**: projects (and optionally initiatives) on a timeline.
- **Git linking**: branch names linked to issues; optional auto-status on merge.
- **Webhooks & public API**: outbound events, API keys for automation.
- **Import / export**: CSV or bulk API.
- **Custom fields**: typed fields beyond built-ins.
- **Keyboard-first polish**: command palette, navigation shortcuts (TanStack Hotkeys is already in the stack).
- **Initiatives / goals**: roll up projects or issues.

## Non-goals (for now)

- Replacing Better Auth’s organization/invitation flows.
- Full parity with Linear’s enterprise feature set (SLAs, customer requests portal, etc.).