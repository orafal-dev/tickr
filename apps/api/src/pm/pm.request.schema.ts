import { z } from 'zod';

export const prioritySchema = z.enum([
  'urgent',
  'high',
  'medium',
  'low',
  'none',
]);

export const projectLifecycleSchema = z.enum([
  'planned',
  'active',
  'completed',
  'paused',
]);

export const listIssuesQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    statusId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    labelId: z.string().uuid().optional(),
    assigneeId: z.string().min(1).optional(),
    includeArchived: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .transform((value) => ({
    ...value,
    includeArchived: value.includeArchived === 'true',
  }));

export const createLabelBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(32).optional(),
});

export const updateLabelBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    color: z.string().trim().min(1).max(32).optional(),
  })
  .refine((value) => value.name !== undefined || value.color !== undefined, {
    message: 'Provide at least one field to update.',
  });

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(8000).optional(),
  status: projectLifecycleSchema.optional(),
});

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(8000).optional(),
    status: projectLifecycleSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: 'Provide at least one field to update.' },
  );

export const createIssueBodySchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(100_000).optional(),
  statusId: z.string().uuid().optional(),
  projectId: z.string().uuid().nullable().optional(),
  priority: prioritySchema.optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
});

export const updateIssueBodySchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().max(100_000).optional(),
    statusId: z.string().uuid().optional(),
    projectId: z.string().uuid().nullable().optional(),
    priority: prioritySchema.optional(),
    archived: z.boolean().optional(),
    labelIds: z.array(z.string().uuid()).optional(),
    assigneeIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.statusId !== undefined ||
      value.projectId !== undefined ||
      value.priority !== undefined ||
      value.archived !== undefined ||
      value.labelIds !== undefined ||
      value.assigneeIds !== undefined,
    { message: 'Provide at least one field to update.' },
  );

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(20000),
});
