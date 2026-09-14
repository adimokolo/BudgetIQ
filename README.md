# BudgetIQ — Smart Expense Tracker

BudgetIQ is a full-stack personal finance and expense-tracking application designed to help users record income and expenses, organise transactions, manage accounts and budgets, monitor spending patterns, and gain clearer insight into their finances.

The project currently includes a **React web application**, a **Node.js/Express REST API**, and an **Expo/React Native mobile application** under active development.

Built by **Adim Barnabas Okolo**, **Pedro Olatunde**, and **Murtala Adedapo** as a portfolio and production-oriented project.

---

## Features

### Authentication & User Management

- JWT-based authentication
- Secure password hashing with bcrypt
- Email verification using a 6-digit OTP
- OTP resend support
- Forgot-password and password-reset flow
- Protected frontend routes
- User profile information
- Profile/avatar upload
- Persistent authenticated sessions
- Light, dark, and system theme preferences

### Accounts

- Create and manage financial accounts
- Associate transactions with accounts
- Track account balances as transactions are recorded
- Support account-specific currencies
- Select accounts while recording converted transactions
- Display the associated account in Transaction History

### Transactions

- Record income and expenses
- Assign categories and accounts
- Edit and delete transactions
- Filter transaction history
- Track transaction dates and descriptions
- Quick-add transactions from the application interface
- Account-linked balance updates
- CSV transaction export
- PDF transaction reports

### Categories

- Separate income and expense categories
- Custom category colours
- Visual category icons
- Category-aware transaction and budget displays

### Budgets

- Create monthly budget limits
- Category-specific or overall budgets
- Live spending progress
- Percentage-based budget tracking
- Budget category icons
- Budget threshold alerts
- In-app budget notifications
- Email alerts when applicable

### Dashboard & Insights

- Income and expense summaries
- Spending visualisations
- Income-vs-expense charts
- Category breakdowns
- Recent transaction activity
- Monthly financial summaries
- Next-month spending forecast based on recent spending data

### Currency Support

- Multiple supported currencies
- User-selectable Base Currency
- Searchable Base Currency picker
- Currency conversion during transaction entry
- Account-aware converted transactions
- Currency amount rounding suitable for financial input fields

> Changing the Base Currency changes how applicable amounts are displayed going forward. Existing transaction values are not automatically converted.

### User Experience

- Responsive web interface
- Light and dark themes
- Skeleton loading states
- Reusable modal system
- Scrollable transaction/converter forms
- Searchable selectors
- Updated BudgetIQ branding shared with the mobile project
- Custom **Crystal Clear** visual design system

---

## Technology Stack

| Layer | Technology |
|---|---|
| Web Frontend | React 18, Vite 5, React Router |
| UI / Charts | Recharts, Lucide React |
| HTTP Client | Axios |
| PDF / Export | jsPDF, jsPDF-AutoTable |
| Backend API | Node.js, Express |
| Authentication | JWT, bcrypt |
| Validation / Security | express-validator, Helmet |
| Database | PostgreSQL |
| Database Client | node-postgres (`pg`) |
| Email | Nodemailer |
| File Uploads | Multer |
| Mobile | Expo 54, React Native, Expo Router |
| Mobile Language | JavaScript / TypeScript ecosystem |
| Containerisation | Docker |
| Planned Cloud Infrastructure | AWS |
| Planned Production Database | Amazon RDS for PostgreSQL |

---

## Project Structure

```text
BudgetIQ/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── schema.sql
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
│
├── mobileDev/
│   ├── assets/
│   ├── app/
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
│
├── postman/
│   └── BudgetIQ.postman_collection.json
│
├── .gitignore
├── package.json
└── README.md
```

---

# Local Development

## Prerequisites

For local development, install:

- Node.js
- npm
- PostgreSQL
- Git

Docker is also required when working with the containerised deployment environment.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd BudgetIQ
```

---

## 2. PostgreSQL Database Setup

Create a PostgreSQL database:

```bash
createdb budgetiq
```

Load the BudgetIQ schema:

```bash
psql -U <PGUSER> -d budgetiq -f backend/schema.sql
```

For local development, PostgreSQL can run directly on the development machine.

The production infrastructure is planned to use **Amazon RDS for PostgreSQL**.

---

## 3. Backend Setup

Move into the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the local environment configuration:

```bash
cp .env.example .env
```

Configure the required values in `.env`.

Start the backend in development mode:

```bash
npm run dev
```

The API runs on port `5000` by default.

Health check:

```text
GET /api/health
```

For a standard local installation this is available at:

```text
http://localhost:5000/api/health
```

Production mode can be started with:

```bash
npm start
```

Database migrations can be run with:

```bash
npm run migrate
```

---

## 4. Backend Environment Variables

BudgetIQ currently references the following backend environment variables.

### Application

```env
NODE_ENV=
PORT=
CLIENT_ORIGIN=
```

### Authentication

```env
JWT_SECRET=
JWT_EXPIRES_IN=
```

### PostgreSQL

```env
PGHOST=
PGPORT=
PGDATABASE=
PGUSER=
PGPASSWORD=
PGSSL=
```

### Email / SMTP

```env
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
```

### Mono Integration

```env
MONO_SEC_KEY=
MONO_WEBHOOK_SEC=
MONO_REDIRECT_URL=
```

Never commit production credentials, database passwords, JWT secrets, SMTP credentials, or API keys to Git.

Use `.env.example` to document required configuration while keeping actual `.env` files private.

---

## 5. Frontend Setup

Open another terminal and move into the frontend:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

During local development, Vite proxies:

```text
/api
```

to:

```text
http://localhost:5000
```

The backend should therefore be running while developing the frontend.

To create a production frontend build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

# Authentication Flow

BudgetIQ requires email verification before normal login.

### Registration

```text
POST /api/auth/register
```

Creates the account and initiates email verification.

### OTP Verification

```text
POST /api/auth/verify-otp
```

Validates the verification code and completes the verification process.

### Resend OTP

```text
POST /api/auth/resend-otp
```

Issues another verification code when required.

### Login

```text
POST /api/auth/login
```

Authenticated users receive a JWT used for protected API requests.

Unverified accounts are prevented from completing the normal login flow until email verification succeeds.

### Forgot Password

```text
POST /api/auth/forgot-password
```

Initiates the password-reset process.

### Reset Password

```text
POST /api/auth/reset-password
```

Completes a valid password reset.

### Local Email Development

OTP verification codes expire after **10 minutes**, while password-reset links expire after **30 minutes**.

When SMTP is not configured for local development, BudgetIQ prints OTP codes and password-reset links to the **backend terminal**, allowing the complete authentication flow to be tested without an email provider.

Production deployments should configure a supported SMTP/email provider.

# Mobile Application

BudgetIQ also contains a mobile application in:

```text
mobileDev/
```

The mobile project uses:

- Expo 54
- React Native
- React 19
- Expo Router
- React Navigation
- Axios
- AsyncStorage
- Expo Secure Store
- Expo Image Picker
- React Native Chart Kit
- React Native SVG

Install its dependencies with:

```bash
cd mobileDev
npm install
```

Start Expo:

```bash
npm start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Expo web:

```bash
npm run web
```

Lint the mobile application with:

```bash
npm run lint
```

The web and mobile applications share the BudgetIQ product identity and are being developed toward a consistent user experience.

---

# Docker

Backend Docker support is currently being developed.

A backend `Dockerfile` is present and currently uses:

```text
node:24-alpine
```

The container:

- installs production dependencies
- exposes port `5000`
- starts `src/server.js`
- includes an HTTP health check against `/api/health`

Example backend image build:

```bash
cd backend
docker build -t budgetiq-backend .
```

Docker deployment should currently be considered **work in progress**.

The complete Docker environment, including Docker Compose and final integration between application services, is still being completed.

---

# AWS Infrastructure

AWS deployment is the next infrastructure phase of BudgetIQ and is **not yet considered complete**.

The planned production architecture includes:

```text
Users
   │
   ▼
BudgetIQ Web / Mobile
   │
   ▼
Backend API
   │
   ▼
Amazon RDS for PostgreSQL
```

The infrastructure phase is expected to include:

- AWS environment configuration
- Backend deployment infrastructure
- Network and security configuration
- Amazon RDS PostgreSQL provisioning
- Secure database connectivity
- Environment/secrets configuration
- Production Docker deployment
- Docker Compose where appropriate
- Production health checks
- HTTPS/reverse-proxy configuration where required
- Deployment automation / CI/CD

This section will be updated as infrastructure components are implemented and validated.

---

# Bank Integration

BudgetIQ includes configuration points for **Mono** integration through:

```env
MONO_SEC_KEY
MONO_WEBHOOK_SEC
MONO_REDIRECT_URL
```

These values must be supplied securely through the runtime environment and must never be committed to source control.

Bank integration functionality should be treated according to the capabilities enabled in the deployed environment.

---

# Transaction Exports

BudgetIQ supports exporting transaction information for external use.

Current web export functionality includes:

- CSV transaction export
- PDF transaction report
- Income summary
- Expense summary
- Net summary

PDF generation uses `jsPDF` and `jsPDF-AutoTable`.

---

# Design System

BudgetIQ uses a custom design system called **Crystal Clear**.

Its visual language includes:

- frosted/glass surfaces
- clipped **Facet Cards**
- prism-gradient accents
- light and dark modes
- responsive layouts
- structured financial data presentation

Primary typography includes:

- **Space Grotesk** — display/headings
- **Inter** — interface/body text
- **JetBrains Mono** — financial/numeric information

The BudgetIQ branding is shared across the web and mobile applications.

---

# API Testing

A Postman collection is included at:

```text
postman/BudgetIQ.postman_collection.json
```

It can be imported into Postman for API development and endpoint testing.

---

# Development Status

BudgetIQ is under active development.

### Implemented / Active

- Web frontend
- REST API
- PostgreSQL data layer
- Authentication and email verification
- Password recovery
- Accounts
- Transactions
- Categories
- Budgets
- Dashboard and charts
- Spending forecasting
- Currency support and conversion
- Base Currency preference
- Transaction exports
- Notifications
- Mobile application development
- Initial backend Dockerfile

### In Progress / Upcoming

- Complete backend Docker deployment
- Docker Compose
- AWS infrastructure setup
- Amazon RDS PostgreSQL provisioning and integration
- Production networking and security configuration
- Production deployment configuration
- CI/CD and deployment automation
- Further web/mobile feature alignment

---

# Security Notes

BudgetIQ handles authentication and financial information, so production deployments should follow appropriate security practices.

In particular:

- never commit `.env` files
- never expose `JWT_SECRET`
- never commit PostgreSQL passwords
- never expose SMTP credentials
- never expose Mono secret keys or webhook secrets
- use encrypted connections for production databases
- restrict database network access
- configure CORS for the deployed frontend origin
- use HTTPS in production
- rotate compromised credentials immediately

---

# Contributors

**Adim Barnabas Okolo**  
**Pedro Olatunde**  
**Murtala Adedapo**

---

# License

MIT — developed for portfolio and production-oriented use.
