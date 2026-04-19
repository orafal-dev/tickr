import { z } from "zod"

const stringifyRichTextInput = (val: unknown): string | undefined => {
  if (val === undefined || val === null) {
    return undefined
  }
  if (typeof val === "string") {
    return val
  }
  if (typeof val === "object") {
    return JSON.stringify(val)
  }
  return String(val)
}

/** True when stored TipTap JSON has visible text, or when value is legacy plain/HTML. */
const storedRichTextHasVisibleContent = (value: string): boolean => {
  const s = value.trim()
  if (!s) {
    return false
  }
  if (!s.startsWith("{")) {
    return true
  }
  try {
    const doc = JSON.parse(s) as {
      type?: string
      content?: unknown[]
    }
    if (doc.type !== "doc" || !Array.isArray(doc.content)) {
      return true
    }
    const visit = (nodes: unknown[]): boolean => {
      for (const node of nodes) {
        if (!node || typeof node !== "object") {
          continue
        }
        const rec = node as {
          type?: string
          text?: string
          content?: unknown[]
        }
        if (
          rec.type === "text" &&
          typeof rec.text === "string" &&
          rec.text.trim() !== ""
        ) {
          return true
        }
        if (Array.isArray(rec.content) && visit(rec.content)) {
          return true
        }
      }
      return false
    }
    return visit(doc.content)
  } catch {
    return true
  }
}

/** TipTap JSON is stored as TEXT; accept either a JSON string or a parsed doc object. */
const issueDescriptionInputSchema = z.preprocess((val) => {
  return stringifyRichTextInput(val)
}, z.string().max(100_000).optional())

const commentBodyStringSchema = z.preprocess(
  (val) => stringifyRichTextInput(val),
  z.string().max(100_000)
)

export const prioritySchema = z.enum([
  "urgent",
  "high",
  "medium",
  "low",
  "none",
])

export const projectLifecycleSchema = z.enum([
  "planned",
  "active",
  "completed",
  "paused",
])

export const listIssuesQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    statusId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    labelId: z.string().uuid().optional(),
    assigneeId: z.string().min(1).optional(),
    includeArchived: z.enum(["true", "false"]).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .transform((value) => ({
    ...value,
    includeArchived: value.includeArchived === "true",
  }))

export const createLabelBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(32).optional(),
})

export const updateLabelBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    color: z.string().trim().min(1).max(32).optional(),
  })
  .refine((value) => value.name !== undefined || value.color !== undefined, {
    message: "Provide at least one field to update.",
  })

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: issueDescriptionInputSchema,
  status: projectLifecycleSchema.optional(),
})

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: issueDescriptionInputSchema,
    status: projectLifecycleSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "Provide at least one field to update." }
  )

export const createIssueBodySchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: issueDescriptionInputSchema,
  statusId: z.string().uuid().optional(),
  projectId: z.string().uuid().nullable().optional(),
  priority: prioritySchema.optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
})

export const updateIssueBodySchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: issueDescriptionInputSchema,
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
    { message: "Provide at least one field to update." }
  )

export const createCommentBodySchema = z
  .object({
    body: commentBodyStringSchema,
  })
  .refine((value) => storedRichTextHasVisibleContent(value.body), {
    message: "Comment body cannot be empty.",
    path: ["body"],
  })

export const reorderStatusesBodySchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
})
