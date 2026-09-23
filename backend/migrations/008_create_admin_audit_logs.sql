CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,

  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action VARCHAR(50) NOT NULL,

  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id
  ON admin_audit_logs(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id
  ON admin_audit_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON admin_audit_logs(action);
