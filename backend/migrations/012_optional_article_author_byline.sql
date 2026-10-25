-- Optional public author byline fields for Money Insights articles.
-- Apply only after the project's production migration procedure has been verified.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(180),
  ADD COLUMN IF NOT EXISTS author_role VARCHAR(180),
  ADD COLUMN IF NOT EXISTS author_organization VARCHAR(240),
  ADD COLUMN IF NOT EXISTS author_affiliation VARCHAR(240);
