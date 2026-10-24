# KashMetrix AdSense Content Readiness — Handoff

## Safety rules
- Preserve all uncommitted changes in this isolated worktree.
- Do not reset, stash, clean, commit, push, deploy, run migrations, or enable ads without explicit user approval.
- Do not modify the original `~/projects/BudgetIQ` worktree; it contains active UFE/OPay work.
- Do not modify Expo/mobile files or trigger mobile builds.
- Never print database passwords, full connection strings, or the AWS RDS endpoint.
- Work one step at a time and prefer targeted, read-only commands.

## Branch checkpoint
- Product: KashMetrix
- Slogan: TRACK SMARTER, UNDERSTAND MORE.
- Original worktree: `~/projects/BudgetIQ`
- Isolated worktree: `~/projects/BudgetIQ-adsense-readiness`
- Branch: `Barnie/adsense-content-readiness`
- HEAD at checkpoint: `bbff7b0` — Merge pull request #99 from adimokolo/release/fidelity-pdf-fix
- Current changes are uncommitted and must be preserved.

## Files changed or added

Modified:
- `backend/src/server.js`
- `frontend/src/App.jsx`
- `frontend/src/components/AdminLayout.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/styles/home.css`

Added:
- `backend/migrations/011_create_articles.sql`
- `backend/src/controllers/articleController.js`
- `backend/src/routes/articles.js`
- `backups/`
- `docs-adsense-cms-migration-note.md`
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/src/pages/AdminArticles.jsx`
- `frontend/src/pages/MoneyInsightArticle.jsx`
- `frontend/src/pages/MoneyInsights.jsx`
- `frontend/src/styles/moneyInsights.css`

Original versions of three replaced frontend files were backed up in:
`backups/article-editor-before-patch-20261022-184523/`

## AdSense context
The previous AdSense rejection said: “Google-served ads on screens without publisher-content.”

The Vite/React frontend initially serves an empty `<div id="root"></div>` and article content is rendered client-side. A crawlable/static HTML approach for public article pages remains necessary before claiming AdSense readiness.

Ads remain disabled:
- `ENABLE_WEB_ADS=false`
- `ADSENSE_CLIENT=""`
- `ADSENSE_DASHBOARD_SLOT=""`

Existing `frontend/public/ads.txt`:
`google.com, pub-8683588639077779, DIRECT, f08c47fec0942fa0`

Do not enable ads or request AdSense review without explicit approval.

## CMS implementation
The article API and admin editor are present in this worktree. Admin endpoints use authentication and admin authorization; public endpoints expose published articles only.

The block editor stores a JSON envelope in the existing `articles.body` TEXT field:
- Optional featured image with URL, alt text and caption
- Paragraph
- Heading
- Subheading
- List
- Inline image

Legacy plain-text/Markdown bodies remain supported. Images currently use HTTPS URLs only. File uploads are deferred until persistent storage is selected.

“Understanding Your Monthly Spending” was vetted but has not been inserted or published. Preserve its approved wording; do not seed or publish it without approval.

## Verification
- `git diff --check` passed earlier.
- Frontend build passed after the editor patch: `npm --prefix frontend run build` (`built in 6.91s`).
- Browser/API end-to-end tests remain outstanding.
- No commit, push, deployment, production migration or ad activation has occurred.

## Database environments
- Local development PostgreSQL runs directly inside WSL.
- Remote production database is AWS RDS PostgreSQL.
- `pg_isready` returned `/var/run/postgresql:5432 - accepting connections`.
- Original Compose configuration lists only `backend` and `frontend`; it does not define PostgreSQL.
- `backend/src/config/db.js` reads `PGHOST`, `PGPORT` (default 5432), `PGDATABASE`, and `PGUSER`.
- The original `~/projects/BudgetIQ/backend/.env` contains these settings. Do not expose their values in chat.
- A prior host classification reported `DOCKER_OR_LOCAL_NETWORK`; this was not conclusive proof of the actual target.
- Verify the intended local database connection before using it. Never allow this test to write to AWS RDS.

### Migration blocker
- Do not run `npm run migrate`.
- `backend/package.json` refers to `node src/utils/migrate.js`, but `backend/src/utils/migrate.js` is missing.
- `backend/migrations/011_create_articles.sql` has not been applied.
- No SQL has been run for this CMS work.
- Restore/review the migration procedure and verify the local connection before applying the articles migration.

## Docker isolation warnings
The original helper is `~/projects/BudgetIQ/scripts/local-deploy.sh`. It builds and recreates containers and then invokes a cleanup script. Do not run it unchanged from the isolated worktree.

The isolated `docker-compose.yml` currently uses:
- Fixed container names: `budgetiq-backend`, `budgetiq-frontend`
- Fixed network: `budgetiq-network`
- Backend host port `5000`
- Frontend host port `5173`

These can conflict with the original project. A safe isolated test setup should remove fixed container names, use a unique network and unused host ports, and connect only to the verified local WSL database.

Earlier `docker ps -a` output showed:
- `budgetiq-frontend`: Exited (0)
- `budgetiq-backend`: Exited (137)

Those statuses were reported as approximately 45 hours old at the time of inspection.

## Dependencies and deployment pipeline
Frontend install reported 9 vulnerabilities: 4 moderate, 4 high, 1 critical. It also warned that install scripts for `core-js` and `esbuild` were not approved. Do not run `npm audit fix --force` without review.

Existing `.github/workflows/cicd.yml`:
- Runs for pushes to `main` and PRs targeting `main`
- Frontend build uses `npm ci`, `VITE_API_URL=/api`, and `npm run build`
- Deploy syncs `frontend-dist/` to `s3://budgetiq-frontend-prod/` with `--delete`
- CloudFront invalidation ID: `E3HU962K15N32S`, path `/*`
- AWS region: `eu-central-1`
- Uses `secrets.AWS_ROLE_ARN`
- Backend changes build/push a Docker image and replace the EC2 `budgetiq-backend` container

Do not change CI/CD or production deployment without explicit approval.

## Next steps
1. Keep the current uncommitted work intact.
2. Verify the local WSL PostgreSQL database/user and connection without displaying secrets or connecting to RDS.
3. Review `docs-adsense-cms-migration-note.md` and address the missing migration runner before any migration.
4. Prepare isolated Docker testing with unique container/network names and non-conflicting ports.
5. Test public article list/detail, draft invisibility, admin authorization, slug conflicts, editor save/reload/rendering, and SEO metadata.
6. Address crawlable public article HTML before claiming AdSense readiness.
7. Keep all changes local until the user explicitly approves commit, push, migration or deployment.

## Privacy
Do not include database passwords, full connection strings, RDS endpoints, or private bank statements in this README or terminal output.
