ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS budget_id UUID
REFERENCES budgets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_budget_id
ON notifications(budget_id);
