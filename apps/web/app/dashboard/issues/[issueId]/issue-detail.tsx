"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import {
  applyRecordToIssueListRow,
  patchIssueAcrossPmIssuesLists,
  PM_ISSUES_LIST_QUERY_PREFIX,
  replaceIssueRowAcrossPmIssuesLists,
  restorePmIssuesListsSnapshot,
  snapshotPmIssuesLists,
} from "@/lib/pm-issues-cache";
import { pmJson } from "@/lib/pm-browser";
import type {
  IssueDetailResponse,
  IssueListRow,
  PmLabel,
  PmProject,
  PmStatus,
} from "@/lib/pm.types";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Field,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { RichTextDisplay } from "@workspace/ui/components/rich-text-display";
import { RichTextEditor } from "@workspace/ui/components/rich-text-editor";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  isStoredRichTextContentEmpty,
  stringifyStoredRichTextInput,
} from "@workspace/ui/lib/rich-text-tiptap";

type CommentRow = Readonly<{
  id: string;
  body: string;
  authorUserId: string;
  createdAt: string;
}>;

const PRIORITY_ORDER = [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
] as const;

const formatPriorityLabel = (priority: string) => {
  const normalized = priority.trim().toLowerCase();
  const known = PRIORITY_ORDER.find((p) => p === normalized);
  if (known) {
    return known.charAt(0).toUpperCase() + known.slice(1);
  }
  if (!priority) {
    return "None";
  }
  return priority
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Mounted only when `issue` exists, with `key={issue.id}` so title/description
 * state is initialized from server JSON — avoids RichTextEditor mounting with
 * empty `value` before a parent `useEffect` could hydrate state.
 */
const IssueTitleDescriptionBlock = ({
  issue,
  patchPending,
  onPatch,
}: Readonly<{
  issue: IssueListRow;
  patchPending: boolean;
  onPatch: (body: Record<string, unknown>) => void;
}>) => {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(() =>
    stringifyStoredRichTextInput(issue.description),
  );

  useEffect(() => {
    setTitle(issue.title);
    setDescription(stringifyStoredRichTextInput(issue.description));
  }, [issue.description, issue.id, issue.title]);

  const handleSaveCore = () => {
    const descriptionPayload =
      typeof description === "string"
        ? description
        : stringifyStoredRichTextInput(description);
    onPatch({
      title: title.trim(),
      description: descriptionPayload,
    });
  };

  return (
    <div className="flex flex-col gap-3 lg:col-span-2">
      <Field name="title">
        <FieldLabel>Title</FieldLabel>
        <Input
          aria-label="Issue title"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          value={title}
        />
      </Field>
      <Field name="description">
        <FieldLabel>Description</FieldLabel>
        <RichTextEditor
          aria-label="Issue description"
          disabled={patchPending}
          onChange={setDescription}
          value={description}
        />
      </Field>
      <div>
        <Button
          disabled={patchPending}
          onClick={handleSaveCore}
          type="button"
        >
          Save title & description
        </Button>
      </div>
    </div>
  );
};

export const IssueDetail = () => {
  const params = useParams();
  const issueId = String(params.issueId ?? "");
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrganizationId = session?.session.activeOrganizationId ?? "";
  const actorUserId = session?.user.id ?? "";

  const workspaceQuery = useQuery({
    queryKey: ["pm", "workspace"],
    queryFn: () => pmJson<{ organizationSlug: string | null }>("/workspace"),
    enabled: Boolean(activeOrganizationId),
  });

  const detailQuery = useQuery({
    queryKey: ["pm", "issue", issueId],
    queryFn: () => pmJson<IssueDetailResponse>(`/issues/${issueId}`),
    enabled: Boolean(activeOrganizationId) && issueId.length > 0,
  });

  const statusesQuery = useQuery({
    queryKey: ["pm", "statuses"],
    queryFn: () => pmJson<PmStatus[]>("/statuses"),
    enabled: Boolean(activeOrganizationId),
  });

  const labelsQuery = useQuery({
    queryKey: ["pm", "labels"],
    queryFn: () => pmJson<PmLabel[]>("/labels"),
    enabled: Boolean(activeOrganizationId),
  });

  const projectsQuery = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: () => pmJson<PmProject[]>("/projects"),
    enabled: Boolean(activeOrganizationId),
  });

  const membersQuery = useQuery({
    queryKey: ["organization", "members", activeOrganizationId],
    queryFn: async () => {
      const response = await authClient.organization.listMembers({
        query: { organizationId: activeOrganizationId },
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data.members;
    },
    enabled: Boolean(activeOrganizationId),
  });

  const commentsQuery = useQuery({
    queryKey: ["pm", "issue", issueId, "comments"],
    queryFn: () => pmJson<CommentRow[]>(`/issues/${issueId}/comments`),
    enabled: Boolean(activeOrganizationId) && issueId.length > 0,
  });

  const issue = detailQuery.data?.issue;

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    setSelectedAssignees(
      detailQuery.data.assignees.map((row) => row.userId),
    );
    setSelectedLabels(detailQuery.data.labels.map((label) => label.id));
  }, [detailQuery.data]);

  const slug = workspaceQuery.data?.organizationSlug ?? "org";
  const issueKey = issue
    ? `${slug.toUpperCase()}-${issue.issueNumber}`
    : "";

  const patchIssueMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return pmJson<IssueListRow>(`/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["pm", "issue", issueId] });
      await queryClient.cancelQueries({
        queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
      });
      const prevDetail = queryClient.getQueryData<IssueDetailResponse>([
        "pm",
        "issue",
        issueId,
      ]);
      const prevLists = snapshotPmIssuesLists(queryClient);
      const statuses = statusesQuery.data ?? [];
      const projects = projectsQuery.data ?? [];
      const labels = labelsQuery.data ?? [];
      if (prevDetail) {
        const nextIssue = applyRecordToIssueListRow(prevDetail.issue, body, {
          statuses,
          projects,
        });
        let nextLabels = prevDetail.labels;
        if (Array.isArray(body.labelIds)) {
          const labelSet = new Set(body.labelIds.map((id) => String(id)));
          nextLabels = labels.filter((label) => labelSet.has(label.id));
        }
        let nextAssignees = prevDetail.assignees;
        if (Array.isArray(body.assigneeIds)) {
          nextAssignees = body.assigneeIds.map((userId) => ({
            userId: String(userId),
          }));
        }
        queryClient.setQueryData<IssueDetailResponse>(
          ["pm", "issue", issueId],
          {
            ...prevDetail,
            issue: nextIssue,
            labels: nextLabels,
            assignees: nextAssignees,
          },
        );
      }
      patchIssueAcrossPmIssuesLists(
        queryClient,
        issueId,
        body,
        { statuses, projects },
        prevDetail?.issue ?? null,
      );
      return { prevDetail, prevLists };
    },
    onError: (_error, _body, context) => {
      if (context?.prevDetail !== undefined) {
        queryClient.setQueryData(["pm", "issue", issueId], context.prevDetail);
      }
      if (context?.prevLists) {
        restorePmIssuesListsSnapshot(queryClient, context.prevLists);
      }
    },
    onSuccess: (updatedRow) => {
      queryClient.setQueryData(
        ["pm", "issue", issueId],
        (previous: IssueDetailResponse | undefined) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            issue: { ...previous.issue, ...updatedRow },
          };
        },
      );
      replaceIssueRowAcrossPmIssuesLists(queryClient, issueId, updatedRow);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (bodyJson: string) => {
      return pmJson<CommentRow>(`/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: bodyJson }),
      });
    },
    onMutate: async (bodyJson) => {
      await queryClient.cancelQueries({
        queryKey: ["pm", "issue", issueId, "comments"],
      });
      const prevComments =
        queryClient.getQueryData<CommentRow[]>([
          "pm",
          "issue",
          issueId,
          "comments",
        ]) ?? [];
      const tempId = `optimistic-comment:${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimistic: CommentRow = {
        id: tempId,
        body: bodyJson,
        authorUserId: actorUserId,
        createdAt: now,
      };
      queryClient.setQueryData<CommentRow[]>(
        ["pm", "issue", issueId, "comments"],
        [...prevComments, optimistic],
      );
      return { prevComments, tempId };
    },
    onError: (_error, _body, context) => {
      queryClient.setQueryData(
        ["pm", "issue", issueId, "comments"],
        context?.prevComments ?? [],
      );
    },
    onSuccess: (row, _body, context) => {
      setCommentBody("");
      queryClient.setQueryData<CommentRow[]>(
        ["pm", "issue", issueId, "comments"],
        (previous) => {
          const list = previous ?? [];
          const stripped = list.filter((rowItem) => rowItem.id !== context?.tempId);
          const withoutDup = stripped.filter((rowItem) => rowItem.id !== row.id);
          return [...withoutDup, row];
        },
      );
    },
  });

  const memberById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      map.set(member.user.id, member.user.name ?? member.user.email);
    }
    return map;
  }, [membersQuery.data]);

  if (!activeOrganizationId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a workspace from the header first.
      </p>
    );
  }

  if (detailQuery.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {(detailQuery.error as Error).message}
      </p>
    );
  }

  if (detailQuery.isPending || !issue) {
    return <p className="text-muted-foreground text-sm">Loading issue…</p>;
  }

  const statuses = statusesQuery.data ?? [];
  const statusLabel =
    statuses.find((row) => row.id === issue.statusId)?.name ??
    issue.statusName ??
    "Status";

  const projects = projectsQuery.data ?? [];
  const projectLabel =
    issue.projectId == null || issue.projectId.length === 0
      ? "No project"
      : (projects.find((row) => row.id === issue.projectId)?.name ??
        issue.projectName ??
        "Project");

  const priorityLabel = formatPriorityLabel(issue.priority);
  const hasStatusOption = statuses.some((row) => row.id === issue.statusId);
  const hasProjectOption =
    issue.projectId == null ||
    issue.projectId.length === 0 ||
    projects.some((row) => row.id === issue.projectId);
  const hasPriorityOption = PRIORITY_ORDER.includes(
    issue.priority as (typeof PRIORITY_ORDER)[number],
  );

  const handleToggleAssignee = (userId: string, checked: boolean) => {
    const next = new Set(selectedAssignees);
    if (checked) {
      next.add(userId);
    } else {
      next.delete(userId);
    }
    const value = [...next];
    setSelectedAssignees(value);
    patchIssueMutation.mutate({ assigneeIds: value });
  };

  const handleToggleLabel = (labelId: string, checked: boolean) => {
    const next = new Set(selectedLabels);
    if (checked) {
      next.add(labelId);
    } else {
      next.delete(labelId);
    }
    const value = [...next];
    setSelectedLabels(value);
    patchIssueMutation.mutate({ labelIds: value });
  };

  const handleAddComment = () => {
    if (isStoredRichTextContentEmpty(commentBody)) {
      return;
    }
    addCommentMutation.mutate(commentBody);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          className="text-muted-foreground text-sm hover:underline"
          href="/dashboard/issues"
        >
          ← Back to issues
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{issueKey}</p>
        <h1 className="font-heading text-2xl font-medium">{issue.title}</h1>
      </div>

      <section
        aria-label="Issue fields"
        className="grid gap-4 rounded-lg border bg-card p-4 shadow-xs/5 lg:grid-cols-2"
      >
        <IssueTitleDescriptionBlock
          issue={issue}
          key={issue.id}
          onPatch={(body) => {
            patchIssueMutation.mutate(body);
          }}
          patchPending={patchIssueMutation.isPending}
        />

        <Field name="status">
          <FieldLabel>Status</FieldLabel>
          <Select
            onValueChange={(next) => {
              patchIssueMutation.mutate({ statusId: next as string });
            }}
            value={issue.statusId}
          >
            <SelectTrigger aria-label="Issue status" className="w-full">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {!hasStatusOption ? (
                <SelectItem value={issue.statusId}>
                  {issue.statusName || statusLabel}
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

        <Field name="priority">
          <FieldLabel>Priority</FieldLabel>
          <Select
            onValueChange={(next) => {
              patchIssueMutation.mutate({ priority: next as string });
            }}
            value={issue.priority}
          >
            <SelectTrigger aria-label="Issue priority" className="w-full">
              <SelectValue>{priorityLabel}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {!hasPriorityOption ? (
                <SelectItem value={issue.priority}>{priorityLabel}</SelectItem>
              ) : null}
              {PRIORITY_ORDER.map((priority) => (
                <SelectItem
                  className="capitalize"
                  key={priority}
                  value={priority}
                >
                  {formatPriorityLabel(priority)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>

        <Field name="project">
          <FieldLabel>Project</FieldLabel>
          <Select
            onValueChange={(next) => {
              const value = next as string;
              patchIssueMutation.mutate({
                projectId: value.length === 0 ? null : value,
              });
            }}
            value={issue.projectId ?? ""}
          >
            <SelectTrigger aria-label="Issue project" className="w-full">
              <SelectValue>{projectLabel}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="">No project</SelectItem>
              {!hasProjectOption && issue.projectId ? (
                <SelectItem value={issue.projectId}>
                  {issue.projectName ?? projectLabel}
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

        <Label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(issue.archivedAt)}
            onCheckedChange={(checked) => {
              patchIssueMutation.mutate({ archived: checked === true });
            }}
          />
          Archived
        </Label>
      </section>

      <section
        aria-label="Assignees"
        className="rounded-lg border bg-card p-4 shadow-xs/5"
      >
        <h2 className="mb-3 font-medium">Assignees</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(membersQuery.data ?? []).map((member) => (
            <Label
              className="flex cursor-pointer items-center gap-2 text-sm"
              key={member.user.id}
            >
              <Checkbox
                checked={selectedAssignees.includes(member.user.id)}
                onCheckedChange={(checked) => {
                  handleToggleAssignee(member.user.id, checked === true);
                }}
              />
              {member.user.name ?? member.user.email}
            </Label>
          ))}
        </div>
      </section>

      <section
        aria-label="Labels"
        className="rounded-lg border bg-card p-4 shadow-xs/5"
      >
        <h2 className="mb-3 font-medium">Labels</h2>
        <div className="flex flex-wrap gap-3">
          {(labelsQuery.data ?? []).map((label) => (
            <Label
              className="flex cursor-pointer items-center gap-2 text-sm"
              key={label.id}
            >
              <Checkbox
                checked={selectedLabels.includes(label.id)}
                onCheckedChange={(checked) => {
                  handleToggleLabel(label.id, checked === true);
                }}
              />
              <span
                aria-hidden
                className="ring-background size-3 shrink-0 rounded-full border border-border shadow-xs/5 ring-2"
                style={{ backgroundColor: label.color }}
              />
              <span>{label.name}</span>
            </Label>
          ))}
        </div>
      </section>

      <section
        aria-label="Comments"
        className="rounded-lg border bg-card p-4 shadow-xs/5"
      >
        <h2 className="mb-3 font-medium">Comments</h2>
        <ul className="flex flex-col gap-3">
          {(commentsQuery.data ?? []).map((comment) => (
            <li className="border-b pb-3 last:border-b-0" key={comment.id}>
              <div className="text-muted-foreground mb-1 text-xs">
                {memberById.get(comment.authorUserId) ?? comment.authorUserId}{' '}
                · {new Date(comment.createdAt).toLocaleString()}
              </div>
              <RichTextDisplay
                aria-label={`Comment ${comment.id}`}
                className="text-sm"
                value={stringifyStoredRichTextInput(comment.body)}
              />
            </li>
          ))}
          {!commentsQuery.isPending &&
          (commentsQuery.data ?? []).length === 0 ? (
            <li className="text-muted-foreground text-sm">No comments yet.</li>
          ) : null}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          <Field name="comment">
            <FieldLabel>Add comment</FieldLabel>
            <RichTextEditor
              aria-label="New comment"
              disabled={addCommentMutation.isPending}
              onChange={setCommentBody}
              value={commentBody}
            />
          </Field>
          <Button
            disabled={
              addCommentMutation.isPending ||
              isStoredRichTextContentEmpty(commentBody)
            }
            onClick={handleAddComment}
            type="button"
          >
            Post comment
          </Button>
        </div>
      </section>
    </div>
  );
};
