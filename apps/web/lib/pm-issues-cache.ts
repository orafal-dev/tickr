import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type {
  PmIssuesListQueryFilters,
  PmIssuesListSnapshot,
} from "@/lib/pm-issues-cache.types";
import type { IssueListRow, PmProject, PmStatus } from "@/lib/pm.types";

export const PM_ISSUES_LIST_QUERY_PREFIX = ["pm", "issues"] as const;

export const parsePmIssuesListQueryFilters = (
  queryKey: QueryKey,
): PmIssuesListQueryFilters | null => {
  if (!Array.isArray(queryKey) || queryKey.length < 3) {
    return null;
  }
  if (queryKey[0] !== "pm" || queryKey[1] !== "issues") {
    return null;
  }
  const raw = queryKey[2];
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const f = raw as Record<string, unknown>;
  return {
    searchText: typeof f.searchText === "string" ? f.searchText : "",
    statusId: typeof f.statusId === "string" ? f.statusId : "",
    projectId: typeof f.projectId === "string" ? f.projectId : "",
    labelId: typeof f.labelId === "string" ? f.labelId : "",
    assigneeId: typeof f.assigneeId === "string" ? f.assigneeId : "",
    includeArchived: f.includeArchived === true,
    viewMode: typeof f.viewMode === "string" ? f.viewMode : "",
  };
};

const rowVisibleForIssuesListFilters = (
  filters: PmIssuesListQueryFilters,
  row: IssueListRow,
  ctx: Readonly<{
    wasOnList: boolean;
    patchBody: Record<string, unknown>;
  }>,
): boolean => {
  if (!filters.includeArchived && row.archivedAt) {
    return false;
  }
  if (filters.statusId && row.statusId !== filters.statusId) {
    return false;
  }
  if (filters.projectId && row.projectId !== filters.projectId) {
    return false;
  }
  if (filters.assigneeId) {
    const ids = ctx.patchBody.assigneeIds;
    if (Array.isArray(ids)) {
      if (!ids.includes(filters.assigneeId)) {
        return false;
      }
    } else if (!ctx.wasOnList) {
      return false;
    }
  }
  if (filters.labelId) {
    const ids = ctx.patchBody.labelIds;
    if (Array.isArray(ids)) {
      if (!ids.includes(filters.labelId)) {
        return false;
      }
    } else if (!ctx.wasOnList) {
      return false;
    }
  }
  const q = filters.searchText.trim();
  if (q.length > 0) {
    const needle = q.toLowerCase();
    const title = row.title.toLowerCase();
    const description = row.description.toLowerCase();
    if (!title.includes(needle) && !description.includes(needle)) {
      return false;
    }
  }
  return true;
};

export const sortIssuesListByUpdatedAtDesc = (list: readonly IssueListRow[]) => {
  return [...list].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
};

export const issueRowMatchesPmIssuesListFilters = (
  filters: PmIssuesListQueryFilters,
  row: IssueListRow,
): boolean => {
  return rowVisibleForIssuesListFilters(filters, row, {
    wasOnList: false,
    patchBody: {},
  });
};

export const snapshotPmIssuesLists = (
  queryClient: QueryClient,
): PmIssuesListSnapshot => {
  return queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
};

export const restorePmIssuesListsSnapshot = (
  queryClient: QueryClient,
  snapshot: PmIssuesListSnapshot,
) => {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
};

export const applyRecordToIssueListRow = (
  issue: IssueListRow,
  body: Record<string, unknown>,
  refs: Readonly<{
    statuses: readonly PmStatus[];
    projects: readonly PmProject[];
  }>,
): IssueListRow => {
  let next: IssueListRow = issue;
  const now = new Date().toISOString();
  if (typeof body.title === "string") {
    next = { ...next, title: body.title, updatedAt: now };
  }
  if (typeof body.description === "string") {
    next = { ...next, description: body.description, updatedAt: now };
  }
  if (typeof body.statusId === "string") {
    const st = refs.statuses.find((s) => s.id === body.statusId);
    next = {
      ...next,
      statusId: body.statusId,
      statusName: st?.name ?? next.statusName,
      statusCategory: st?.category ?? next.statusCategory,
      updatedAt: now,
    };
  }
  if (body.projectId !== undefined) {
    const pid =
      body.projectId === null || body.projectId === ""
        ? null
        : String(body.projectId);
    const pr = pid ? refs.projects.find((p) => p.id === pid) : undefined;
    next = {
      ...next,
      projectId: pid,
      projectName: pid ? (pr?.name ?? next.projectName) : null,
      updatedAt: now,
    };
  }
  if (typeof body.priority === "string") {
    next = { ...next, priority: body.priority, updatedAt: now };
  }
  if (typeof body.archived === "boolean") {
    next = {
      ...next,
      archivedAt: body.archived ? now : null,
      updatedAt: now,
    };
  }
  return next;
};

export const computeNextIssuesListAfterPatch = (
  queryKey: QueryKey,
  list: IssueListRow[],
  issueId: string,
  patchBody: Record<string, unknown>,
  refs: Readonly<{
    statuses: readonly PmStatus[];
    projects: readonly PmProject[];
  }>,
  detailFallback: IssueListRow | null,
): IssueListRow[] => {
  const filters = parsePmIssuesListQueryFilters(queryKey);
  if (!filters) {
    return list;
  }
  const idx = list.findIndex((row) => row.id === issueId);
  const base = idx >= 0 ? list[idx] : detailFallback;
  if (!base) {
    return list;
  }
  const merged = applyRecordToIssueListRow(base, patchBody, refs);
  const visible = rowVisibleForIssuesListFilters(filters, merged, {
    wasOnList: idx >= 0,
    patchBody,
  });
  const without = list.filter((row) => row.id !== issueId);
  if (!visible) {
    return without;
  }
  return sortIssuesListByUpdatedAtDesc([merged, ...without]);
};

export const patchIssueAcrossPmIssuesLists = (
  queryClient: QueryClient,
  issueId: string,
  patchBody: Record<string, unknown>,
  refs: Readonly<{
    statuses: readonly PmStatus[];
    projects: readonly PmProject[];
  }>,
  detailFallback: IssueListRow | null,
) => {
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  for (const [key, list] of entries) {
    if (!list) {
      continue;
    }
    const next = computeNextIssuesListAfterPatch(
      key,
      list,
      issueId,
      patchBody,
      refs,
      detailFallback,
    );
    queryClient.setQueryData(key, next);
  }
};

export const replaceIssueRowAcrossPmIssuesLists = (
  queryClient: QueryClient,
  issueId: string,
  row: IssueListRow,
) => {
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  for (const [key, list] of entries) {
    if (!list) {
      continue;
    }
    const filters = parsePmIssuesListQueryFilters(key);
    if (!filters) {
      continue;
    }
    const idx = list.findIndex((i) => i.id === issueId);
    if (idx >= 0) {
      const without = list.filter((i) => i.id !== issueId);
      const visible = rowVisibleForIssuesListFilters(filters, row, {
        wasOnList: true,
        patchBody: {},
      });
      if (!visible) {
        queryClient.setQueryData(key, without);
        continue;
      }
      queryClient.setQueryData(
        key,
        sortIssuesListByUpdatedAtDesc([row, ...without]),
      );
      continue;
    }
    if (filters.assigneeId || filters.labelId) {
      void queryClient.invalidateQueries({ queryKey: key });
      continue;
    }
    const visible = rowVisibleForIssuesListFilters(filters, row, {
      wasOnList: false,
      patchBody: {},
    });
    if (!visible) {
      continue;
    }
    queryClient.setQueryData(key, sortIssuesListByUpdatedAtDesc([row, ...list]));
  }
};

export const removeIssueFromAllPmIssuesLists = (
  queryClient: QueryClient,
  issueId: string,
) => {
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  for (const [key, list] of entries) {
    if (!list) {
      continue;
    }
    queryClient.setQueryData(
      key,
      list.filter((row) => row.id !== issueId),
    );
  }
};

export const finalizeOptimisticIssueCreate = (
  queryClient: QueryClient,
  tempId: string,
  row: IssueListRow,
) => {
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  for (const [key, list] of entries) {
    if (!list) {
      continue;
    }
    const filters = parsePmIssuesListQueryFilters(key);
    if (!filters) {
      continue;
    }
    const stripped = list.filter((i) => i.id !== tempId);
    const visible = rowVisibleForIssuesListFilters(filters, row, {
      wasOnList: false,
      patchBody: {},
    });
    if (!visible) {
      queryClient.setQueryData(key, stripped);
      continue;
    }
    if (stripped.some((i) => i.id === row.id)) {
      queryClient.setQueryData(
        key,
        sortIssuesListByUpdatedAtDesc(
          stripped.map((i) => (i.id === row.id ? row : i)),
        ),
      );
      continue;
    }
    queryClient.setQueryData(key, sortIssuesListByUpdatedAtDesc([row, ...stripped]));
  }
};

export const applyStatusMoveAcrossPmIssuesLists = (
  queryClient: QueryClient,
  issueIds: readonly string[],
  status: PmStatus,
) => {
  const idSet = new Set(issueIds);
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  const union = new Map<string, IssueListRow>();
  for (const [, list] of entries) {
    if (!list) {
      continue;
    }
    for (const row of list) {
      union.set(row.id, row);
    }
  }
  const now = new Date().toISOString();
  const movedById = new Map<string, IssueListRow>();
  for (const id of issueIds) {
    const base = union.get(id);
    if (!base) {
      continue;
    }
    movedById.set(id, {
      ...base,
      statusId: status.id,
      statusName: status.name,
      statusCategory: status.category,
      updatedAt: now,
    });
  }
  for (const [key, list] of entries) {
    if (!list) {
      continue;
    }
    const filters = parsePmIssuesListQueryFilters(key);
    if (!filters) {
      continue;
    }
    let next = list.map((row) => movedById.get(row.id) ?? row);
    next = next.filter((row) =>
      rowVisibleForIssuesListFilters(filters, row, {
        wasOnList: true,
        patchBody: {},
      }),
    );
    const idsInNext = new Set(next.map((r) => r.id));
    for (const row of movedById.values()) {
      if (idsInNext.has(row.id)) {
        continue;
      }
      if (
        rowVisibleForIssuesListFilters(filters, row, {
          wasOnList: false,
          patchBody: {},
        })
      ) {
        next = [...next, row];
      }
    }
    queryClient.setQueryData(key, sortIssuesListByUpdatedAtDesc(next));
  }
  if (idSet.size > 0 && movedById.size < idSet.size) {
    void queryClient.invalidateQueries({
      queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
    });
  }
};

export const pickDefaultPmStatus = (
  statuses: readonly PmStatus[],
): PmStatus | null => {
  if (statuses.length === 0) {
    return null;
  }
  return (
    [...statuses].sort(
      (a, b) => a.position - b.position || a.name.localeCompare(b.name),
    )[0] ?? null
  );
};

export const maxIssueNumberAcrossPmIssuesLists = (
  queryClient: QueryClient,
): number => {
  let max = 0;
  const entries = queryClient.getQueriesData<IssueListRow[]>({
    queryKey: [...PM_ISSUES_LIST_QUERY_PREFIX],
  });
  for (const [, list] of entries) {
    if (!list) {
      continue;
    }
    for (const row of list) {
      if (typeof row.issueNumber === "number") {
        max = Math.max(max, row.issueNumber);
      }
    }
  }
  return max;
};
