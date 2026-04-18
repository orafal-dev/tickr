import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

import { PmAuthGuard } from './pm-auth.guard';
import { PmCtx } from './pm.decorators';
import {
  createCommentBodySchema,
  createIssueBodySchema,
  createLabelBodySchema,
  createProjectBodySchema,
  listIssuesQuerySchema,
  updateIssueBodySchema,
  updateLabelBodySchema,
  updateProjectBodySchema,
} from './pm.request.schema';
import { PmService } from './pm.service';
import type { PmContext } from './pm.types';

const parseOrThrow = <T>(schema: ZodTypeAny, input: unknown): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.flatten());
  }
  return parsed.data as T;
};

@Controller('pm')
@UseGuards(PmAuthGuard)
export class PmController {
  constructor(private readonly pmService: PmService) {}

  @Get('workspace')
  getWorkspace(@PmCtx() ctx: PmContext): Promise<{
    readonly organizationSlug: string | null;
  }> {
    return this.pmService.getWorkspaceMeta(ctx.organizationId);
  }

  @Get('statuses')
  listStatuses(@PmCtx() ctx: PmContext): Promise<unknown[]> {
    return this.pmService.listStatuses(ctx.organizationId);
  }

  @Get('labels')
  listLabels(@PmCtx() ctx: PmContext): Promise<unknown[]> {
    return this.pmService.listLabels(ctx.organizationId);
  }

  @Post('labels')
  createLabel(
    @PmCtx() ctx: PmContext,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.createLabel(
      ctx.organizationId,
      parseOrThrow(createLabelBodySchema, body),
    );
  }

  @Patch('labels/:labelId')
  updateLabel(
    @PmCtx() ctx: PmContext,
    @Param('labelId') labelId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.updateLabel(
      ctx.organizationId,
      labelId,
      parseOrThrow(updateLabelBodySchema, body),
    );
  }

  @Delete('labels/:labelId')
  deleteLabel(
    @PmCtx() ctx: PmContext,
    @Param('labelId') labelId: string,
  ): Promise<void> {
    return this.pmService.deleteLabel(ctx.organizationId, labelId);
  }

  @Get('projects')
  listProjects(@PmCtx() ctx: PmContext): Promise<unknown[]> {
    return this.pmService.listProjects(ctx.organizationId);
  }

  @Post('projects')
  createProject(
    @PmCtx() ctx: PmContext,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.createProject(
      ctx.organizationId,
      parseOrThrow(createProjectBodySchema, body),
    );
  }

  @Patch('projects/:projectId')
  updateProject(
    @PmCtx() ctx: PmContext,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.updateProject(
      ctx.organizationId,
      projectId,
      parseOrThrow(updateProjectBodySchema, body),
    );
  }

  @Get('issues')
  listIssues(
    @PmCtx() ctx: PmContext,
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<unknown[]> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        normalized[key] = value;
      } else if (Array.isArray(value) && typeof value[0] === 'string') {
        normalized[key] = value[0];
      }
    }
    return this.pmService.listIssues(
      ctx.organizationId,
      parseOrThrow(listIssuesQuerySchema, normalized),
    );
  }

  @Post('issues')
  createIssue(
    @PmCtx() ctx: PmContext,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.createIssue(
      ctx.organizationId,
      ctx.userId,
      parseOrThrow(createIssueBodySchema, body),
    );
  }

  @Get('issues/:issueId/comments')
  listComments(
    @PmCtx() ctx: PmContext,
    @Param('issueId') issueId: string,
  ): Promise<unknown[]> {
    return this.pmService.listComments(ctx.organizationId, issueId);
  }

  @Post('issues/:issueId/comments')
  createComment(
    @PmCtx() ctx: PmContext,
    @Param('issueId') issueId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.createComment(
      ctx.organizationId,
      issueId,
      ctx.userId,
      parseOrThrow(createCommentBodySchema, body),
    );
  }

  @Get('issues/:issueId')
  getIssue(
    @PmCtx() ctx: PmContext,
    @Param('issueId') issueId: string,
  ): Promise<unknown> {
    return this.pmService.getIssue(ctx.organizationId, issueId);
  }

  @Patch('issues/:issueId')
  updateIssue(
    @PmCtx() ctx: PmContext,
    @Param('issueId') issueId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.pmService.updateIssue(
      ctx.organizationId,
      issueId,
      ctx.userId,
      parseOrThrow(updateIssueBodySchema, body),
    );
  }

  @Get('notifications')
  listNotifications(@PmCtx() ctx: PmContext): Promise<unknown[]> {
    return this.pmService.listNotifications(
      ctx.organizationId,
      ctx.userId,
    );
  }

  @Patch('notifications/:notificationId/read')
  markNotificationRead(
    @PmCtx() ctx: PmContext,
    @Param('notificationId') notificationId: string,
  ): Promise<void> {
    return this.pmService.markNotificationRead(
      ctx.organizationId,
      ctx.userId,
      notificationId,
    );
  }

  @Post('notifications/read-all')
  markAllNotificationsRead(@PmCtx() ctx: PmContext): Promise<void> {
    return this.pmService.markAllNotificationsRead(
      ctx.organizationId,
      ctx.userId,
    );
  }
}
