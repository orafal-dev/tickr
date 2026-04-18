export type IssueListRow = Readonly<{
  id: string;
  issueNumber: number;
  title: string;
  description: string;
  priority: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  statusId: string;
  projectId: string | null;
  statusName: string;
  statusCategory: string;
  projectName: string | null;
}>;

export type IssueDetailResponse = Readonly<{
  issue: IssueListRow;
  labels: ReadonlyArray<{
    id: string;
    name: string;
    color: string;
  }>;
  assignees: ReadonlyArray<{ userId: string }>;
}>;

export type PmLabel = Readonly<{
  id: string;
  name: string;
  color: string;
  createdAt: string;
}>;

export type PmProject = Readonly<{
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}>;

export type PmStatus = Readonly<{
  id: string;
  name: string;
  position: number;
  category: string;
  createdAt: string;
}>;

export type PmNotification = Readonly<{
  id: string;
  type: string;
  issueId: string | null;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}>;
