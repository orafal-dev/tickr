"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"

import { IssuesKanban } from "@/app/dashboard/issues/issues-kanban"
import { authClient } from "@/lib/auth-client"
import {
  finalizeOptimisticIssueCreate,
  issueRowMatchesPmIssuesListFilters,
  maxIssueNumberAcrossPmIssuesLists,
  parsePmIssuesListQueryFilters,
  pickDefaultPmStatus,
  PM_ISSUES_LIST_QUERY_PREFIX,
  restorePmIssuesListsSnapshot,
  snapshotPmIssuesLists,
  sortIssuesListByUpdatedAtDesc,
} from "@/lib/pm-issues-cache"
import { pmJson } from "@/lib/pm-browser"
import type { IssueListRow, PmLabel, PmProject, PmStatus } from "@/lib/pm.types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/menu"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { buttonVariants } from "@workspace/ui/components/button.variants"
import { cn } from "@workspace/ui/lib/utils"
import {
  FilterIcon,
  LayoutTwoColumnIcon,
  PlusSignIcon,
  Search01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons"

type IssuesViewMode = "table" | "board"

export const IssuesBoard = () => {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const activeOrganizationId = session?.session.activeOrganizationId ?? ""
  const actorUserId = session?.user.id ?? ""

  const [viewMode, setViewMode] = useState<IssuesViewMode>("board")
  const [createIssueOpen, setCreateIssueOpen] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [statusId, setStatusId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [labelId, setLabelId] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const workspaceQuery = useQuery({
    queryKey: ["pm", "workspace"],
    queryFn: () => pmJson<{ organizationSlug: string | null }>("/workspace"),
    enabled: Boolean(activeOrganizationId),
  })

  const statusesQuery = useQuery({
    queryKey: ["pm", "statuses"],
    queryFn: () => pmJson<PmStatus[]>("/statuses"),
    enabled: Boolean(activeOrganizationId),
  })

  const labelsQuery = useQuery({
    queryKey: ["pm", "labels"],
    queryFn: () => pmJson<PmLabel[]>("/labels"),
    enabled: Boolean(activeOrganizationId),
  })

  const projectsQuery = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: () => pmJson<PmProject[]>("/projects"),
    enabled: Boolean(activeOrganizationId),
  })

  const membersQuery = useQuery({
    queryKey: ["organization", "members", activeOrganizationId],
    queryFn: async () => {
      const response = await authClient.organization.listMembers({
        query: { organizationId: activeOrganizationId },
      })
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data.members
    },
    enabled: Boolean(activeOrganizationId),
  })

  const issuesQueryKey = useMemo(
    () => [
      "pm",
      "issues",
      {
        searchText,
        statusId,
        projectId,
        labelId,
        assigneeId,
        includeArchived,
        viewMode,
      },
    ],
    [
      assigneeId,
      includeArchived,
      labelId,
      projectId,
      searchText,
      statusId,
      viewMode,
    ]
  )

  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchText.trim().length > 0) {
        params.set("q", searchText.trim())
      }
      if (statusId) {
        params.set("statusId", statusId)
      }
      if (projectId) {
        params.set("projectId", projectId)
      }
      if (labelId) {
        params.set("labelId", labelId)
      }
      if (assigneeId) {
        params.set("assigneeId", assigneeId)
      }
      if (includeArchived) {
        params.set("includeArchived", "true")
      }
      if (viewMode === "board") {
        params.set("limit", "200")
      }
      const qs = params.toString()
      return pmJson<IssueListRow[]>(`/issues${qs ? `?${qs}` : ""}`)
    },
    enabled: Boolean(activeOrganizationId),
  })

  const createIssueMutation = useMutation({
    mutationFn: async (title: string) => {
      return pmJson<IssueListRow>("/issues", {
        method: "POST",
        body: JSON.stringify({ title }),
      })
    },
    onMutate: async (title) => {
      await queryClient.cancelQueries({
        queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
      })
      const prevLists = snapshotPmIssuesLists(queryClient)
      const statuses =
        queryClient.getQueryData<PmStatus[]>(["pm", "statuses"]) ?? []
      const defaultStatus = pickDefaultPmStatus(statuses)
      if (!defaultStatus) {
        return { prevLists, tempId: null as string | null }
      }
      const trimmed = title.trim()
      const tempId = crypto.randomUUID()
      const now = new Date().toISOString()
      const nextNumber = maxIssueNumberAcrossPmIssuesLists(queryClient) + 1
      const optimistic: IssueListRow = {
        id: tempId,
        issueNumber: nextNumber,
        title: trimmed,
        description: "",
        priority: "none",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        statusId: defaultStatus.id,
        projectId: null,
        statusName: defaultStatus.name,
        statusCategory: defaultStatus.category,
        projectName: null,
      }
      const entries = queryClient.getQueriesData<IssueListRow[]>({
        queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
      })
      for (const [key, list] of entries) {
        if (!list) {
          continue
        }
        const filters = parsePmIssuesListQueryFilters(key)
        if (!filters) {
          continue
        }
        if (!issueRowMatchesPmIssuesListFilters(filters, optimistic)) {
          continue
        }
        queryClient.setQueryData(
          key,
          sortIssuesListByUpdatedAtDesc([optimistic, ...list])
        )
      }
      return { prevLists, tempId }
    },
    onError: (_error, _title, context) => {
      if (context?.prevLists) {
        restorePmIssuesListsSnapshot(queryClient, context.prevLists)
      }
    },
    onSuccess: (row, _title, context) => {
      setNewTitle("")
      setCreateIssueOpen(false)
      if (context?.tempId) {
        finalizeOptimisticIssueCreate(queryClient, context.tempId, row)
        return
      }
      void queryClient.invalidateQueries({
        queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
      })
    },
  })

  const slug = workspaceQuery.data?.organizationSlug ?? "org"

  if (!activeOrganizationId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a workspace from the header to load issues.
      </p>
    )
  }

  const statuses = statusesQuery.data ?? []
  const projects = projectsQuery.data ?? []
  const labels = labelsQuery.data ?? []
  const members = membersQuery.data ?? []

  const statusFilterLabel = statusId
    ? (statuses.find((row) => row.id === statusId)?.name ?? "Unknown status")
    : null
  const projectFilterLabel = projectId
    ? (projects.find((row) => row.id === projectId)?.name ?? "Unknown project")
    : null
  const labelRow = labelId
    ? labels.find((row) => row.id === labelId)
    : undefined
  const labelFilterLabel = labelId ? (labelRow?.name ?? "Unknown label") : null
  const assigneeMember = assigneeId
    ? members.find((row) => row.user.id === assigneeId)
    : undefined
  const assigneeFilterLabel = assigneeMember
    ? (assigneeMember.user.name ?? assigneeMember.user.email)
    : null

  const needsStatusFilterFallback =
    Boolean(statusId) && !statuses.some((row) => row.id === statusId)
  const needsProjectFilterFallback =
    Boolean(projectId) && !projects.some((row) => row.id === projectId)
  const needsLabelFilterFallback =
    Boolean(labelId) && !labels.some((row) => row.id === labelId)
  const needsAssigneeFilterFallback =
    Boolean(assigneeId) && !members.some((row) => row.user.id === assigneeId)

  const hasStructuredFilters =
    Boolean(statusId) ||
    Boolean(projectId) ||
    Boolean(labelId) ||
    Boolean(assigneeId) ||
    includeArchived

  const hasSearchQuery = Boolean(searchText.trim())

  const handleCreateIssue = () => {
    const trimmed = newTitle.trim()
    if (!trimmed) {
      return
    }
    createIssueMutation.mutate(trimmed)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-medium">Issues</h1>
          <p className="text-sm text-muted-foreground">
            Keys use <span className="font-mono text-xs">{slug}</span> and a
            number.
          </p>
        </div>
        <div
          aria-label="Issues toolbar"
          className="flex shrink-0 items-center gap-0.5"
          role="toolbar"
        >
          <Popover>
            <PopoverTrigger
              aria-label="Search issues"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative"
              )}
              type="button"
            >
              <UiIcon aria-hidden className="size-4" icon={Search01Icon} />
              {hasSearchQuery ? (
                <span
                  aria-hidden
                  className="inset-e-1 absolute top-1 size-2 rounded-full bg-primary ring-2 ring-background"
                />
              ) : null}
            </PopoverTrigger>
            <PopoverPopup
              align="end"
              className="w-[min(22rem,calc(100vw-2rem))]"
            >
              <div className="flex flex-col gap-2">
                <Field name="filter-search">
                  <FieldLabel>Search</FieldLabel>
                  <Input
                    aria-label="Search issues"
                    autoFocus
                    onChange={(event) => {
                      setSearchText(event.target.value)
                    }}
                    placeholder="Title or description"
                    value={searchText}
                  />
                </Field>
              </div>
            </PopoverPopup>
          </Popover>

          <Popover>
            <PopoverTrigger
              aria-label="Filter issues"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative"
              )}
              type="button"
            >
              <UiIcon aria-hidden className="size-4" icon={FilterIcon} />
              {hasStructuredFilters ? (
                <span
                  aria-hidden
                  className="inset-e-1 absolute top-1 size-2 rounded-full bg-primary ring-2 ring-background"
                />
              ) : null}
            </PopoverTrigger>
            <PopoverPopup
              align="end"
              className="w-[min(22rem,calc(100vw-2rem))]"
            >
              <div className="flex max-h-[min(70vh,32rem)] flex-col gap-3 overflow-y-auto pe-1">
                <Field name="filter-status">
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    onValueChange={(next) => {
                      setStatusId(next as string)
                    }}
                    value={statusId}
                  >
                    <SelectTrigger
                      aria-label="Filter by status"
                      className="w-full"
                    >
                      {statusId ? (
                        <SelectValue>{statusFilterLabel}</SelectValue>
                      ) : (
                        <SelectValue placeholder="Any status" />
                      )}
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="">Any status</SelectItem>
                      {needsStatusFilterFallback ? (
                        <SelectItem value={statusId}>
                          {statusFilterLabel}
                        </SelectItem>
                      ) : null}
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Field name="filter-project">
                  <FieldLabel>Project</FieldLabel>
                  <Select
                    onValueChange={(next) => {
                      setProjectId(next as string)
                    }}
                    value={projectId}
                  >
                    <SelectTrigger
                      aria-label="Filter by project"
                      className="w-full"
                    >
                      {projectId ? (
                        <SelectValue>{projectFilterLabel}</SelectValue>
                      ) : (
                        <SelectValue placeholder="Any project" />
                      )}
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="">Any project</SelectItem>
                      {needsProjectFilterFallback ? (
                        <SelectItem value={projectId}>
                          {projectFilterLabel}
                        </SelectItem>
                      ) : null}
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Field name="filter-label">
                  <FieldLabel>Label</FieldLabel>
                  <Select
                    onValueChange={(next) => {
                      setLabelId(next as string)
                    }}
                    value={labelId}
                  >
                    <SelectTrigger
                      aria-label="Filter by label"
                      className="w-full"
                    >
                      {labelId ? (
                        <SelectValue>
                          <span className="flex min-w-0 items-center gap-2">
                            {labelRow ? (
                              <span
                                aria-hidden
                                className="size-2.5 shrink-0 rounded-full border border-border ring-1 ring-background"
                                style={{ backgroundColor: labelRow.color }}
                              />
                            ) : null}
                            <span className="truncate">{labelFilterLabel}</span>
                          </span>
                        </SelectValue>
                      ) : (
                        <SelectValue placeholder="Any label" />
                      )}
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="">Any label</SelectItem>
                      {needsLabelFilterFallback ? (
                        <SelectItem value={labelId}>
                          {labelFilterLabel}
                        </SelectItem>
                      ) : null}
                      {labels.map((label) => (
                        <SelectItem key={label.id} value={label.id}>
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2.5 shrink-0 rounded-full border border-border ring-1 ring-background"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="truncate">{label.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Field name="filter-assignee">
                  <FieldLabel>Assignee</FieldLabel>
                  <Select
                    onValueChange={(next) => {
                      setAssigneeId(next as string)
                    }}
                    value={assigneeId}
                  >
                    <SelectTrigger
                      aria-label="Filter by assignee"
                      className="w-full"
                    >
                      {assigneeId ? (
                        <SelectValue>
                          {assigneeFilterLabel ?? "Unknown member"}
                        </SelectValue>
                      ) : (
                        <SelectValue placeholder="Anyone" />
                      )}
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="">Anyone</SelectItem>
                      {needsAssigneeFilterFallback ? (
                        <SelectItem value={assigneeId}>
                          {assigneeFilterLabel ?? "Unknown member"}
                        </SelectItem>
                      ) : null}
                      {members.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.name ?? member.user.email}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeArchived}
                    onCheckedChange={(checked) => {
                      setIncludeArchived(checked === true)
                    }}
                  />
                  Include archived
                </Label>
              </div>
            </PopoverPopup>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Display and layout"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              type="button"
            >
              <UiIcon
                aria-hidden
                className="size-4"
                icon={LayoutTwoColumnIcon}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(next) => {
                    setViewMode(next as IssuesViewMode)
                  }}
                  value={viewMode}
                >
                  <DropdownMenuRadioItem value="board">
                    <span className="flex items-center gap-2">
                      <UiIcon
                        aria-hidden
                        className="size-4 opacity-80"
                        icon={LayoutTwoColumnIcon}
                      />
                      Board
                    </span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="table">
                    <span className="flex items-center gap-2">
                      <UiIcon
                        aria-hidden
                        className="size-4 opacity-80"
                        icon={Table01Icon}
                      />
                      Table
                    </span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover onOpenChange={setCreateIssueOpen} open={createIssueOpen}>
            <PopoverTrigger
              aria-label="Create issue"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              type="button"
            >
              <UiIcon aria-hidden className="size-4" icon={PlusSignIcon} />
            </PopoverTrigger>
            <PopoverPopup
              align="end"
              className="w-[min(22rem,calc(100vw-2rem))]"
            >
              <Field name="new-issue-title">
                <FieldLabel>New issue</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    aria-label="Issue title"
                    className="sm:flex-1"
                    onChange={(event) => {
                      setNewTitle(event.target.value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleCreateIssue()
                      }
                    }}
                    placeholder="Title"
                    value={newTitle}
                  />
                  <Button
                    disabled={createIssueMutation.isPending || !newTitle.trim()}
                    onClick={handleCreateIssue}
                    type="button"
                  >
                    Create
                  </Button>
                </div>
              </Field>
            </PopoverPopup>
          </Popover>
        </div>
      </div>

      {issuesQuery.isError ? (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {(issuesQuery.error as Error).message}
        </p>
      ) : null}

      {viewMode === "board" ? (
        issuesQuery.isPending ? (
          <p className="shrink-0 text-sm text-muted-foreground">
            Loading issues…
          </p>
        ) : (
          <IssuesKanban
            issues={issuesQuery.data ?? []}
            slug={slug}
            statuses={statuses}
          />
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {issuesQuery.isPending ? (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                    Loading issues…
                  </td>
                </tr>
              ) : null}
              {(issuesQuery.data ?? []).map((issue) => (
                <tr className="border-t" key={issue.id}>
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      className="text-primary underline-offset-2 hover:underline"
                      href={`/dashboard/issues/${issue.id}`}
                    >
                      {slug.toUpperCase()}-{issue.issueNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="font-medium hover:underline"
                      href={`/dashboard/issues/${issue.id}`}
                    >
                      {issue.title}
                    </Link>
                    {issue.archivedAt ? (
                      <span className="ms-2 text-xs text-muted-foreground">
                        Archived
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{issue.statusName}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {issue.projectName ?? "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">{issue.priority}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(issue.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!issuesQuery.isPending &&
              (issuesQuery.data ?? []).length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-muted-foreground" colSpan={6}>
                    No issues match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
