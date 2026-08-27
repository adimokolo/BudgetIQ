# BudgetIQ — Smart Expense Tracker

A full-stack expense tracker: record, categorize, and monitor income and
spending, with an interactive dashboard, visual charts, monthly summaries,
a next-month spending forecast, and budget limits.

Built by **Adim Barnabas Okolo** as a portfolio / educational project.

## Tech stack

| Layer     | Technology                              |
|-----------|------------------------------------------|
| Frontend  | React 18 (Vite), React Router, Recharts, Axios |
| Backend   | Node.js, Express, JWT auth, bcrypt       |
| Database  | PostgreSQL (Amazon RDS in production)    |

## Project structure

```
budgetiq/
├── backend/
│   ├── schema.sql              # PostgreSQL schema (run this first)
│   ├── .env.example            # copy to .env and fill in
│   └── src/
│       ├── server.js           # Express entrypoint
│       ├── config/db.js        # pg connection pool
│       ├── middleware/auth.js  # JWT verification
│       ├── controllers/        # auth, transactions, categories, budgets, dashboard
│       ├── routes/
│       └── utils/predict.js    # spending forecast (linear regression)
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx / main.jsx
        ├── pages/               # Login, Register, Dashboard, Transactions, Categories, Budgets
        ├── components/          # Sidebar, charts, cards, modal
        ├── context/             # Auth + Theme (light/dark) providers
        └── styles/theme.css     # "Crystal Clear" design system
```

## 1. Database setup (PostgreSQL / Amazon RDS)

Create a database, then load the schema:

```bash
createdb budgetiq          # or create it via your RDS console
psql -h <PGHOST> -U <PGUSER> -d budgetiq -f backend/schema.sql
```

For a quick local test without RDS, install Postgres locally and point
`PGHOST` at `localhost`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your PGHOST / PGUSER / PGPASSWORD / JWT_SECRET
npm install
npm run dev      # nodemon, http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so
no CORS config is needed locally — just make sure the backend is running
first. For production, set `CLIENT_ORIGIN` in the backend `.env` to your
deployed frontend URL.

## Authentication flow

Registration now requires email verification before login is allowed:

1. `POST /api/auth/register` creates the account (unverified) and emails a 6-digit OTP — no token is returned yet.
2. `POST /api/auth/verify-otp` checks the code; on success it marks the account verified and returns a login token.
3. `POST /api/auth/resend-otp` issues a new code if the first one expired (10-minute TTL).
4. `POST /api/auth/login` now rejects unverified accounts with `403 { code: 'EMAIL_NOT_VERIFIED' }`, which the frontend uses to redirect to the verification screen.
5. `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` handle password resets via a time-limited (30-minute) emailed link. Both this and OTP delivery give an identical response whether or not the email is registered, to avoid leaking which addresses have accounts.

**No SMTP configured yet?** That's fine for local development — leave `SMTP_HOST` blank in `.env` and every OTP code and reset link prints to the **backend terminal** instead of being emailed, so the whole flow is testable without a mail provider. Run `backend/migrations/001_add_auth_verification.sql` once against any database created before this feature existed (fresh installs via `schema.sql` already include it).

## Key features

- **User authentication** — JWT-based, bcrypt-hashed passwords, email verification via OTP, forgot/reset password, protected routes
- **Transaction management** — add, edit, delete, filter by type/category/date
- **Category organization** — custom income & expense categories with colors
- **Visual dashboard** — income vs. expense trend, category breakdown donut chart, recent activity
- **Monthly summaries & forecasting** — next-month spending prediction using linear regression over recent monthly totals
- **Budget limits** — set a monthly cap per category (or overall) and track progress with a live percentage bar

## Design

The interface uses a custom **"Crystal Clear"** design system rather than a
generic dashboard template:

- Signature **Facet Card** — a glass panel with one clipped corner and a
  prism-gradient border (cyan → violet → mint) that sharpens on hover
- Light mode (frosted glass on pale ice-blue) is the default; dark mode
  (deep obsidian with glowing facets) is a toggle in the sidebar
- Typography: Space Grotesk (display), Inter (body), JetBrains Mono (numeric data)

## DevOps

Deployment (Docker Compose, Nginx, CI/CD, EC2/RDS provisioning) is intentionally
out of scope for this phase and will be handled separately.

## License

MIT — built for educational and portfolio purposes.
