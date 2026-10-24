-- Article CMS schema. Do not apply until the project's migration procedure is restored/verified.
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  summary VARCHAR(320) NOT NULL,
  body TEXT NOT NULL,
  seo_title VARCHAR(180) NOT NULL,
  meta_description VARCHAR(320) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT articles_published_timestamp_check CHECK ((status='published' AND published_at IS NOT NULL) OR (status='draft' AND published_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC) WHERE status='published' AND published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_status_updated_at ON articles(status,updated_at DESC);
