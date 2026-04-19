import type { QueryKey } from "@tanstack/react-query";

import type { IssueListRow } from "@/lib/pm.types";

export type PmIssuesListQueryFilters = Readonly<{
  searchText: string;
  statusId: string;
  projectId: string;
  labelId: string;
  assigneeId: string;
  includeArchived: boolean;
  viewMode: string;
}>;

export type PmIssuesListSnapshot = ReadonlyArray<
  readonly [QueryKey, IssueListRow[] | undefined]
>;
