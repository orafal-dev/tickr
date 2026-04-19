"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CollisionPriority,
  type DragEndEvent,
} from "@dnd-kit/abstract";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useDraggable,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import type {
  IssueColumnDropData,
  IssueDragData,
  IssuesKanbanViewProps,
} from "@/app/dashboard/issues/issues-kanban.types";
import {
  applyStatusMoveAcrossPmIssuesLists,
  PM_ISSUES_LIST_QUERY_PREFIX,
  restorePmIssuesListsSnapshot,
  snapshotPmIssuesLists,
} from "@/lib/pm-issues-cache";
import { pmJson } from "@/lib/pm-browser";
import type { IssueListRow, PmStatus } from "@/lib/pm.types";

const KANBAN_COLUMN_GROUP = "kanban-status-columns";
const STATUS_COLUMN_TYPE = "issue-status-column";
const ISSUE_DRAG_TYPE = "issue";
const ISSUE_COLUMN_DROP_TYPE = "issue-column-body";

type KanbanColumnSortSource = Readonly<{
  sortable: Readonly<{
    group: string;
    initialIndex: number;
    index: number;
  }>;
}>;

const isKanbanColumnSortDrag = (
  source: unknown,
): source is KanbanColumnSortSource => {
  if (!source || typeof source !== "object") {
    return false;
  }
  const sortable = (source as { sortable?: unknown }).sortable;
  if (!sortable || typeof sortable !== "object") {
    return false;
  }
  const group = (sortable as { group?: unknown }).group;
  const initialIndex = (sortable as { initialIndex?: unknown }).initialIndex;
  const index = (sortable as { index?: unknown }).index;
  if (
    group !== KANBAN_COLUMN_GROUP ||
    typeof initialIndex !== "number" ||
    typeof index !== "number"
  ) {
    return false;
  }
  return true;
};

const arrayMove = (items: readonly string[], from: number, to: number) => {
  if (from === to) {
    return [...items];
  }
  const next = [...items];
  const [removed] = next.splice(from, 1);
  if (removed === undefined) {
    return [...items];
  }
  next.splice(to, 0, removed);
  return next;
};

const IssueCard = ({
  issue,
  issueKeyLabel,
  isSelected,
  selectedIds,
  onIssuePointerDown,
}: Readonly<{
  issue: IssueListRow;
  issueKeyLabel: string;
  isSelected: boolean;
  selectedIds: ReadonlySet<string>;
  onIssuePointerDown: (issueId: string, shiftKey: boolean) => void;
}>) => {
  const issueDragPayload: IssueDragData = useMemo(() => {
    if (selectedIds.has(issue.id)) {
      return { issueIds: [...selectedIds] };
    }
    return { issueIds: [issue.id] };
  }, [issue.id, selectedIds]);

  const { ref, handleRef, isDragging } = useDraggable({
    id: issue.id,
    type: ISSUE_DRAG_TYPE,
    data: issueDragPayload,
  });

  const handleCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-kanban-issue-drag-handle]")) {
      return;
    }
    if (target?.closest("a")) {
      return;
    }
    onIssuePointerDown(issue.id, event.shiftKey);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onIssuePointerDown(issue.id, event.shiftKey);
    }
  };

  return (
    <div
      className={`rounded-md border bg-background shadow-xs/5 transition-[box-shadow,opacity] ${
        isSelected ? "ring-primary ring-2 ring-offset-2 ring-offset-background" : ""
      } ${isDragging ? "opacity-60" : ""}`}
      onKeyDown={handleCardKeyDown}
      onPointerDown={handleCardPointerDown}
      ref={ref}
      role="group"
      tabIndex={0}
      aria-label={`Issue ${issueKeyLabel}: ${issue.title}`}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-2 p-2">
        <button
          aria-label={`Drag issue ${issueKeyLabel}`}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
          data-kanban-issue-drag-handle
          ref={handleRef}
          type="button"
        >
          <span aria-hidden className="block size-4">
            <svg fill="currentColor" viewBox="0 0 16 16">
              <circle cx="5" cy="4" r="1.25" />
              <circle cx="11" cy="4" r="1.25" />
              <circle cx="5" cy="8" r="1.25" />
              <circle cx="11" cy="8" r="1.25" />
              <circle cx="5" cy="12" r="1.25" />
              <circle cx="11" cy="12" r="1.25" />
            </svg>
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-muted-foreground text-xs">
              {issueKeyLabel}
            </span>
            <span className="text-muted-foreground text-[10px] uppercase">
              {issue.priority}
            </span>
          </div>
          <Link
            className="text-foreground mt-0.5 block font-medium leading-snug underline-offset-2 hover:underline"
            href={`/dashboard/issues/${issue.id}`}
            onClick={(event) => {
              if (event.shiftKey) {
                event.preventDefault();
              }
            }}
          >
            {issue.title}
          </Link>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({
  status,
  index,
  issues,
  slug,
  selectedIds,
  onIssuePointerDown,
}: Readonly<{
  status: PmStatus;
  index: number;
  issues: readonly IssueListRow[];
  slug: string;
  selectedIds: ReadonlySet<string>;
  onIssuePointerDown: (issueId: string, shiftKey: boolean) => void;
}>) => {
  const {
    ref: columnRef,
    handleRef,
    targetRef,
    isDragging: columnDragging,
  } = useSortable({
    id: status.id,
    group: KANBAN_COLUMN_GROUP,
    index,
    type: STATUS_COLUMN_TYPE,
    accept: STATUS_COLUMN_TYPE,
    collisionPriority: 2,
  });

  const { ref: issueDropRef, isDropTarget } = useDroppable({
    id: `issue-drop-${status.id}`,
    type: ISSUE_COLUMN_DROP_TYPE,
    accept: ISSUE_DRAG_TYPE,
    data: { statusId: status.id } satisfies IssueColumnDropData,
    collisionPriority: CollisionPriority.High,
  });

  return (
    <div
      className={`bg-card flex h-full min-h-0 w-[min(100%,18rem)] shrink-0 flex-col rounded-lg border shadow-xs/5 ${
        columnDragging ? "opacity-70" : ""
      }`}
      ref={columnRef}
    >
      <div
        className="border-border flex items-center gap-2 border-b px-2 py-2"
        ref={targetRef}
      >
        <button
          aria-label={`Reorder column ${status.name}`}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
          ref={handleRef}
          type="button"
        >
          <span aria-hidden className="block size-4">
            <svg fill="currentColor" viewBox="0 0 16 16">
              <circle cx="4" cy="5" r="1.25" />
              <circle cx="4" cy="11" r="1.25" />
              <circle cx="8" cy="5" r="1.25" />
              <circle cx="8" cy="11" r="1.25" />
              <circle cx="12" cy="5" r="1.25" />
              <circle cx="12" cy="11" r="1.25" />
            </svg>
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">{status.name}</h2>
          <p className="text-muted-foreground text-xs capitalize">
            {status.category}
          </p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {issues.length}
        </span>
      </div>
      <div
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 ${
          isDropTarget ? "bg-primary/5 ring-primary/40 ring-1 ring-inset" : ""
        }`}
        ref={issueDropRef}
      >
        {issues.length === 0 ? (
          <p className="text-muted-foreground px-1 py-6 text-center text-xs">
            Drop issues here
          </p>
        ) : null}
        {issues.map((issue) => {
          const issueKeyLabel = `${slug.toUpperCase()}-${issue.issueNumber}`;
          return (
            <IssueCard
              issue={issue}
              isSelected={selectedIds.has(issue.id)}
              issueKeyLabel={issueKeyLabel}
              key={issue.id}
              onIssuePointerDown={onIssuePointerDown}
              selectedIds={selectedIds}
            />
          );
        })}
      </div>
    </div>
  );
};

export const IssuesKanban = ({
  slug,
  statuses,
  issues,
}: IssuesKanbanViewProps) => {
  const queryClient = useQueryClient();
  const serverColumnOrder = useMemo(() => {
    return [...statuses]
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
      .map((row) => row.id);
  }, [statuses]);

  const [columnOrder, setColumnOrder] = useState<string[]>(serverColumnOrder);

  useEffect(() => {
    setColumnOrder(serverColumnOrder);
  }, [serverColumnOrder.join("|")]);

  const [selectedIds, setSelectedIds] = useState(() => new Set<string>());
  const [anchorIssueId, setAnchorIssueId] = useState<string | null>(null);

  const issuesByStatus = useMemo(() => {
    const map = new Map<string, IssueListRow[]>();
    for (const issue of issues) {
      const bucket = map.get(issue.statusId) ?? [];
      bucket.push(issue);
      map.set(issue.statusId, bucket);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    return map;
  }, [issues]);

  const flattenedIssueIds = useMemo(() => {
    const out: string[] = [];
    for (const statusId of columnOrder) {
      const rows = issuesByStatus.get(statusId) ?? [];
      for (const row of rows) {
        out.push(row.id);
      }
    }
    return out;
  }, [columnOrder, issuesByStatus]);

  const issueById = useMemo(() => {
    const map = new Map<string, IssueListRow>();
    for (const issue of issues) {
      map.set(issue.id, issue);
    }
    return map;
  }, [issues]);

  const reorderStatusesMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      return pmJson<PmStatus[]>("/statuses/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "statuses"] });
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "statuses"] });
    },
  });

  const moveIssuesMutation = useMutation({
    mutationFn: async (input: { statusId: string; issueIds: readonly string[] }) => {
      await Promise.all(
        input.issueIds.map((issueId) =>
          pmJson<IssueListRow>(`/issues/${issueId}`, {
            method: "PATCH",
            body: JSON.stringify({ statusId: input.statusId }),
          }),
        ),
      );
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
      });
      const prevLists = snapshotPmIssuesLists(queryClient);
      const target = statuses.find((row) => row.id === input.statusId);
      if (!target) {
        return { prevLists };
      }
      applyStatusMoveAcrossPmIssuesLists(queryClient, input.issueIds, target);
      return { prevLists };
    },
    onError: (_error, _input, context) => {
      if (context?.prevLists) {
        restorePmIssuesListsSnapshot(queryClient, context.prevLists);
      }
    },
  });

  const handleIssuePointerDown = useCallback(
    (issueId: string, shiftKey: boolean) => {
      if (shiftKey && anchorIssueId) {
        const i0 = flattenedIssueIds.indexOf(anchorIssueId);
        const i1 = flattenedIssueIds.indexOf(issueId);
        if (i0 === -1 || i1 === -1) {
          setSelectedIds(new Set([issueId]));
          setAnchorIssueId(issueId);
          return;
        }
        const lo = Math.min(i0, i1);
        const hi = Math.max(i0, i1);
        setSelectedIds(new Set(flattenedIssueIds.slice(lo, hi + 1)));
        setAnchorIssueId(issueId);
        return;
      }
      setSelectedIds(new Set([issueId]));
      setAnchorIssueId(issueId);
    },
    [anchorIssueId, flattenedIssueIds],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { operation, canceled } = event;
    if (canceled) {
      return;
    }
    const { source, target } = operation;
    if (!source) {
      return;
    }

    if (isKanbanColumnSortDrag(source)) {
      const from = source.sortable.initialIndex;
      const to = source.sortable.index;
      if (from === to || from < 0 || to < 0) {
        return;
      }
      const nextOrder = arrayMove(columnOrder, from, to);
      setColumnOrder(nextOrder);
      reorderStatusesMutation.mutate(nextOrder);
      return;
    }

    if (!target || target.type !== ISSUE_COLUMN_DROP_TYPE) {
      return;
    }
    if (source.type !== ISSUE_DRAG_TYPE) {
      return;
    }
    const targetStatusId = (target.data as IssueColumnDropData | undefined)
      ?.statusId;
    if (!targetStatusId) {
      return;
    }
    const rawIds =
      (source.data as IssueDragData | undefined)?.issueIds ??
      (typeof source.id === "string" ? [source.id] : []);
    const issueIds = rawIds.map(String);
    const toMove = issueIds.filter((id) => {
      const row = issueById.get(id);
      return row && row.statusId !== targetStatusId;
    });
    if (toMove.length === 0) {
      return;
    }
    moveIssuesMutation.mutate({ statusId: targetStatusId, issueIds: toMove });
    setSelectedIds(new Set());
  };

  const orderedStatuses = useMemo(() => {
    const byId = new Map(statuses.map((row) => [row.id, row]));
    return columnOrder
      .map((id) => byId.get(id))
      .filter((row): row is PmStatus => Boolean(row));
  }, [columnOrder, statuses]);

  return (
    <DragDropProvider
      onDragEnd={handleDragEnd}
      sensors={(defaults) => [
        PointerSensor.configure({
          activationConstraints: [
            new PointerActivationConstraints.Distance({ value: 6 }),
          ],
        }),
        ...defaults.filter((sensor) => sensor !== PointerSensor),
      ]}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="sr-only">
          Drag column headers to reorder statuses. Drag issues by the handle, or
          Shift-click cards to select several, then drop the selection into another
          column. The board loads up to 200 issues with your current filters.
        </p>
        <div className="flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
          <div className="flex h-full min-h-0 flex-row items-stretch gap-3 pe-1">
            {orderedStatuses.map((status, index) => (
              <KanbanColumn
                index={index}
                issues={issuesByStatus.get(status.id) ?? []}
                key={status.id}
                onIssuePointerDown={handleIssuePointerDown}
                selectedIds={selectedIds}
                slug={slug}
                status={status}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {(source) => {
          if (!source || source.type !== ISSUE_DRAG_TYPE) {
            return null;
          }
          const ids =
            (source.data as IssueDragData | undefined)?.issueIds ??
            (typeof source.id === "string" ? [source.id] : []);
          const primary = issueById.get(String(ids[0]));
          if (!primary) {
            return null;
          }
          const primaryKey = `${slug.toUpperCase()}-${primary.issueNumber}`;
          return (
            <div className="bg-background max-w-xs rounded-md border px-3 py-2 shadow-lg">
              <div className="text-muted-foreground font-mono text-xs">
                {ids.length > 1 ? `${ids.length} issues` : primaryKey}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-medium">
                {ids.length > 1 ? "Moving selection" : primary.title}
              </div>
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
};
