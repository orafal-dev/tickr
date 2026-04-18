-- Project management (Linear-like) MVP tables.
-- Run against the same Postgres database used by Better Auth (DATABASE_URL).

CREATE TABLE IF NOT EXISTS pm_issue_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('backlog', 'unstarted', 'started', 'completed', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pm_issue_status_org ON pm_issue_status (organization_id);

CREATE TABLE IF NOT EXISTS pm_label (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS pm_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_project_org ON pm_project (organization_id);

CREATE TABLE IF NOT EXISTS pm_issue_counter (
  organization_id TEXT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pm_issue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  issue_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status_id UUID NOT NULL REFERENCES pm_issue_status (id),
  project_id UUID REFERENCES pm_project (id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  created_by_user_id TEXT NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, issue_number)
);

CREATE INDEX IF NOT EXISTS idx_pm_issue_org ON pm_issue (organization_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_status ON pm_issue (status_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_project ON pm_issue (project_id);

CREATE TABLE IF NOT EXISTS pm_issue_label (
  issue_id UUID NOT NULL REFERENCES pm_issue (id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES pm_label (id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

CREATE TABLE IF NOT EXISTS pm_issue_assignee (
  issue_id UUID NOT NULL REFERENCES pm_issue (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  PRIMARY KEY (issue_id, user_id)
);

CREATE TABLE IF NOT EXISTS pm_issue_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES pm_issue (id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_issue_comment_issue ON pm_issue_comment (issue_id);

CREATE TABLE IF NOT EXISTS pm_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  issue_id UUID REFERENCES pm_issue (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_notification_user ON pm_notification (user_id, read_at);
