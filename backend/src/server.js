require("dotenv").config();

// =========================================================
// MONO KEY CHECK
// =========================================================

const monoKey = process.env.MONO_SEC_KEY?.trim();

console.log("========== MONO KEY CHECK ==========");

console.log({
  loaded: !!monoKey,
  startsWithTestSk: monoKey?.startsWith("test_sk_"),
  startsWithTestPk: monoKey?.startsWith("test_pk_"),
  length: monoKey?.length,
});

console.log("====================================");

// =========================================================
// IMPORTS
// =========================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// =========================================================
// ROUTES
// =========================================================

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const dashboardRoutes = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");
const accountRoutes = require("./routes/accounts");
const notificationRoutes = require("./routes/notifications");
const bankSyncRoutes = require("./routes/bankSync");

// =========================================================
// APP
// =========================================================

const app = express();

// =========================================================
// SECURITY
// =========================================================

app.use(helmet());

// =========================================================
// CORS
// =========================================================

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

    credentials: true,
  }),
);

// =========================================================
// BODY PARSER
// =========================================================

app.use(express.json());

// =========================================================
// LOGGING
// =========================================================

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// =========================================================
// STATIC FILES
// =========================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BudgetIQ API is running.",
    environment: process.env.NODE_ENV || "development",
  });
});

// =========================================================
// API ROUTES
// =========================================================

// Authentication
app.use("/api/auth", authRoutes);

// Categories
app.use("/api/categories", categoryRoutes);

// Transactions
app.use("/api/transactions", transactionRoutes);

// Budgets
app.use("/api/budgets", budgetRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

// Manual accounts
app.use("/api/accounts", accountRoutes);

// =========================================================
// BANK SYNCHRONIZATION / MONO
// =========================================================

app.use("/api/bank-sync", bankSyncRoutes);

// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: "Route not found.",
    method: req.method,
    path: req.originalUrl,
  });
});

// =========================================================
// CENTRAL ERROR HANDLER
// =========================================================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("========================================");

  console.error("SERVER ERROR:");

  console.error(err);

  console.error("========================================");

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Something went wrong on our end. Please try again.",
  });
});

// =========================================================
// SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");

  console.log("       BudgetIQ API Server");

  console.log("========================================");

  console.log(`Server running on port ${PORT}`);

  console.log(`Local: http://localhost:${PORT}`);

  console.log(`Health: http://localhost:${PORT}/api/health`);

  console.log(`Bank Sync: http://localhost:${PORT}/api/bank-sync/health`);

  console.log("========================================");
});

// =========================================================
// EXPORT APP
// =========================================================

module.exports = app;
