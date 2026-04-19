import type { IssueListRow, PmStatus } from "@/lib/pm.types";

export type IssuesKanbanViewProps = Readonly<{
  slug: string;
  statuses: readonly PmStatus[];
  issues: readonly IssueListRow[];
}>;

export type IssueDragData = Readonly<{
  issueIds: readonly string[];
}>;

export type IssueColumnDropData = Readonly<{
  statusId: string;
}>;
