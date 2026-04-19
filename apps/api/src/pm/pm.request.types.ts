import type { z } from 'zod';

import type {
  createCommentBodySchema,
  createIssueBodySchema,
  createLabelBodySchema,
  createProjectBodySchema,
  listIssuesQuerySchema,
  reorderStatusesBodySchema,
  updateIssueBodySchema,
  updateLabelBodySchema,
  updateProjectBodySchema,
} from './pm.request.schema';

export type ListIssuesQuery = z.output<typeof listIssuesQuerySchema>;
export type CreateLabelBody = z.infer<typeof createLabelBodySchema>;
export type UpdateLabelBody = z.infer<typeof updateLabelBodySchema>;
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
export type CreateIssueBody = z.infer<typeof createIssueBodySchema>;
export type UpdateIssueBody = z.infer<typeof updateIssueBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type ReorderStatusesBody = z.infer<typeof reorderStatusesBodySchema>;
