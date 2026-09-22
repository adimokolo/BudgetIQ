require("dotenv").config();

const monoKey = process.env.MONO_SEC_KEY?.trim();

console.log("========== MONO KEY CHECK ==========");

console.log({
  loaded: !!monoKey,
  startsWithTestSk: monoKey?.startsWith("test_sk_"),
  startsWithTestPk: monoKey?.startsWith("test_pk_"),
  length: monoKey?.length,
});

console.log("====================================");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const dashboardRoutes = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");
const accountRoutes = require("./routes/accounts");
const notificationRoutes = require("./routes/notifications");
const bankSyncRoutes = require("./routes/bankSync");
const bankImportRoutes = require("./routes/bankImport");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "20mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  }),
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "BudgetIQ API is running.",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/budgets", budgetRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/accounts", accountRoutes);

app.use("/api/bank-sync", bankSyncRoutes);

app.use("/api/bank-import", bankImportRoutes);

app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);

  return res.status(404).json({
    success: false,
    error: "Route not found.",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("========================================");
  console.error("SERVER ERROR:");
  console.error(err);
  console.error("========================================");

  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      error:
        "The selected image is too large. Please select or upload a smaller image.",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "The request contains invalid JSON.",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "Something went wrong on our end. Please try again.",
  });
});

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

module.exports = app;
