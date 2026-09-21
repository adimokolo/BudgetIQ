const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
router.use(requireAuth);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const fail = (res, code, error) => res.status(code).json({ error });
const pick = (row, keys) => {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(
      ([k]) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === key,
    );
    if (found && String(found[1] ?? "").trim()) return found[1];
  }
  return null;
};
const money = (value) => {
  if (value == null || String(value).trim() === "") return null;
  const cleaned = String(value)
    .replace(/[₦,\s]/g, "")
    .replace(/\(([^)]+)\)/, "-$1");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
};
const dateValue = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    return d
      ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
      : null;
  }
  const text = String(value ?? "").trim();
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso)
    return validDate(
      `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`,
    );
  const local = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (local)
    return validDate(
      `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`,
    );
  return null;
};
function validDate(s) {
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
    ? s
    : null;
}
function normalize(row) {
  const date = dateValue(
    pick(row, [
      "date",
      "transactiondate",
      "valuedate",
      "posteddate",
      "occurredon",
    ]),
  );
  const debit = money(
    pick(row, [
      "debit",
      "withdrawal",
      "withdrawals",
      "moneyout",
      "debitamount",
    ]),
  );
  const credit = money(
    pick(row, ["credit", "deposit", "deposits", "moneyin", "creditamount"]),
  );
  const rawAmount = money(pick(row, ["amount", "transactionamount"]));
  const rawType = String(
    pick(row, ["type", "transactiontype", "drcr", "direction"]) || "",
  ).toLowerCase();
  let type, amount;
  if (debit > 0 && credit > 0) return null;
  if (debit > 0) {
    type = "expense";
    amount = debit;
  } else if (credit > 0) {
    type = "income";
    amount = credit;
  } else if (rawAmount != null && rawAmount !== 0) {
    if (
      rawType.includes("debit") ||
      rawType === "dr" ||
      rawType.includes("expense")
    )
      type = "expense";
    else if (
      rawType.includes("credit") ||
      rawType === "cr" ||
      rawType.includes("income")
    )
      type = "income";
    else if (rawAmount < 0) type = "expense";
    else return null;
    amount = Math.abs(rawAmount);
  } else return null;
  if (
    !date ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1000000000000
  )
    return null;
  const description = String(
    pick(row, [
      "description",
      "narration",
      "details",
      "remarks",
      "particulars",
      "transactiondetails",
      "memo",
    ]) || "Imported bank transaction",
  ).slice(0, 255);
  const reference = String(
    pick(row, [
      "reference",
      "transactionreference",
      "transactionid",
      "ref",
      "sessionid",
    ]) || "",
  )
    .trim()
    .slice(0, 120);
  return {
    date,
    type,
    amount: Math.round(amount * 100) / 100,
    description,
    reference,
  };
}
async function verifyAccount(req, res, source) {
  if (source === "email") {
    if (!String(req.body.bankName || "").trim()) {
      fail(res, 400, "Select the issuing bank.");
      return null;
    }
    return { id: null, currency: "NGN" };
  }
  const accountId = String(req.body.accountId || "").trim();

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(accountId)) {
    fail(res, 400, "Select a valid BudgetIQ account.");
    return null;
  }
  const found = await pool.query(
    "SELECT id,currency FROM accounts WHERE id=$1 AND user_id=$2",
    [accountId, req.user.id],
  );
  if (!found.rowCount) {
    fail(res, 404, "BudgetIQ account not found.");
    return null;
  }
  if (found.rows[0].currency !== "NGN") {
    fail(res, 400, "This importer currently supports NGN accounts only.");
    return null;
  }
  if (!String(req.body.bankName || "").trim()) {
    fail(res, 400, "Select the issuing bank.");
    return null;
  }
  return found.rows[0];
}
async function stage(req, res, source, rows) {
  const account = await verifyAccount(req, res, source);
  if (!account) return;
  if (!rows.length)
    return fail(
      res,
      422,
      "No supported transactions found. Check the file columns, dates, debit/credit amounts and transaction direction.",
    );
  if (rows.length > 2000)
    return fail(res, 413, "Import at most 2,000 rows at a time.");
  const result = await pool.query(
    `INSERT INTO bank_import_batches(user_id,account_id,bank_name,source_type,rows_json)
 VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id`,
    [
      req.user.id,
      account.id,
      String(req.body.bankName).trim().slice(0, 120),
      source,
      JSON.stringify(rows),
    ],
  );
  return res.json({
    importId: result.rows[0].id,
    bankName: req.body.bankName,
    accountId: account.id,
    count: rows.length,
    transactions: rows.slice(0, 30),
    message:
      "Review these entries before confirming. Duplicate imports will be skipped.",
  });
}
router.post(
  "/statement/preview",
  upload.single("statement"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return fail(res, 400, "Select a PDF, CSV, XLS or XLSX statement.");
      const filename = req.file.originalname.toLowerCase();
      if (!/\.(pdf|csv|xls|xlsx)$/.test(filename))
        return fail(
          res,
          415,
          "Only PDF, CSV, XLS and XLSX statements are supported.",
        );
      if (filename.endsWith(".pdf")) {
        const pdf = await pdfParse(req.file.buffer);
        if (pdf.numpages > 20) {
          return fail(
            res,
            413,
            "PDF statements are limited to 20 pages per import.",
          );
        }

        let text = String(pdf.text || "").trim();
        let tempDir = null;

        try {
          // If the PDF contains little/no extractable text, use OCR.
          if (text.length < 100) {
            tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "budgetiq-ocr-"));

            const pdfPath = path.join(tempDir, "statement.pdf");
            const imagePrefix = path.join(tempDir, "page");

            await fs.writeFile(pdfPath, req.file.buffer);

            await execFileAsync("pdftoppm", [
              "-r",
              "300",
              "-png",
              pdfPath,
              imagePrefix,
            ]);

            const files = await fs.readdir(tempDir);

            const pageImages = files
              .filter((file) => /^page-\d+\.png$/.test(file))
              .sort((a, b) => {
                const pageA = Number(a.match(/\d+/)[0]);
                const pageB = Number(b.match(/\d+/)[0]);
                return pageA - pageB;
              });

            if (!pageImages.length) {
              return fail(
                res,
                422,
                "The PDF could not be converted into readable pages. No data was imported.",
              );
            }

            const ocrPages = [];

            for (const pageImage of pageImages) {
              const imagePath = path.join(tempDir, pageImage);

              const { stdout } = await execFileAsync(
                "tesseract",
                [imagePath, "stdout", "--psm", "6", "-l", "eng"],
                { maxBuffer: 10 * 1024 * 1024 },
              );

              ocrPages.push(stdout);
            }

            text = ocrPages.join("\n");
          }

          const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          const rows = [];

          // OCR/table format:
          // Trans Date | Value Date | Debit | Credit | Balance | Narration
          //
          // We intentionally use Trans Date, Debit and Credit.
          // Value Date may occasionally be damaged/truncated by OCR.
          const transactionPattern =
            /^(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+\S+\s+([\d,.]+\.\d{2})\s+([\d,.]+\.\d{2})(?:\s+.*)?$/;

          for (const line of lines) {
            const match = line.match(transactionPattern);

            if (!match) continue;

            const date = dateValue(match[1]);

            const normalizeOcrAmount = (value) => {
              const parts = String(value).split(".");

              // OCR sometimes reads a thousands comma as a dot:
              // 7,350.00 -> 7.350.00
              if (parts.length > 2) {
                const decimals = parts.pop();
                return `${parts.join(",")}.${decimals}`;
              }

              return value;
            };

            const debit = money(normalizeOcrAmount(match[2]));
            const credit = money(normalizeOcrAmount(match[3]));
            if (!date) continue;

            const row = normalize({
              date,
              debit,
              credit,
              description: line,
            });

            if (row) rows.push(row);
          }

          if (!rows.length) {
            return fail(
              res,
              422,
              "No transaction rows could be read safely from this PDF. No data was imported.",
            );
          }

          if (rows.length > 2000) {
            return fail(res, 413, "Import at most 2,000 rows at a time.");
          }

          return stage(req, res, "statement", rows);
        } finally {
          if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true });
          }
        }
      }
      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
        cellDates: true,
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) return fail(res, 422, "Statement has no worksheet.");
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
      if (raw.length > 2000)
        return fail(res, 413, "Import at most 2,000 rows at a time.");
      const rows = raw.map(normalize).filter(Boolean);
      if (rows.length !== raw.length)
        return fail(
          res,
          422,
          `Could parse ${rows.length} of ${raw.length} rows. No data was imported. Check statement headers, dates and debit/credit columns; remove headings, totals and blank rows before retrying.`,
        );
      return stage(req, res, "statement", rows);
    } catch (e) {
      next(e);
    }
  },
);
router.post("/email/preview", async (req, res, next) => {
  try {
    const text = String(req.body.emailText || "");
    if (!text.trim() || text.length > 100000)
      return fail(
        res,
        400,
        "Paste up to 100,000 characters of bank alert text.",
      );
    const blocks = text
      .split(/\n\s*\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (blocks.length > 200)
      return fail(res, 413, "Paste at most 200 alerts at once.");
    const rows = [];
    for (const block of blocks) {
      const typeMatch = block.match(
        /\b(debited|debit|withdrawal|credited|credit|deposit)\b|(?:Txn|Transaction)\s*:\s*(DR|CR)\b/i,
      );
      const amountMatch = block.match(/(?:NGN|₦)\s*([\d,]+(?:\.\d{1,2})?)/i);
      const dateMatch = block.match(
        /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/,
      );
      const date = dateMatch ? dateValue(dateMatch[1]) : null;
      const amount = amountMatch ? money(amountMatch[1]) : null;
      if (!typeMatch || !date || !amount || amount <= 0)
        return fail(
          res,
          422,
          "Could not safely parse every alert. Each alert must contain an explicit debit/credit direction, NGN amount and full date (DD/MM/YYYY or YYYY-MM-DD). Separate alerts with a blank line. No data was imported.",
        );
      const direction = (typeMatch[1] || typeMatch[2] || "").toLowerCase();

      let type;

      if (["debited", "debit", "withdrawal", "dr"].includes(direction)) {
        type = "expense";
      } else if (["credited", "credit", "deposit", "cr"].includes(direction)) {
        type = "income";
      } else {
        return fail(
          res,
          422,
          "Could not determine whether this alert is a debit or credit. No data was imported.",
        );
      }
      rows.push({
        date,
        type,
        amount,
        description: block.replace(/\s+/g, " ").slice(0, 255),
        reference: "",
      });
    }
    return stage(req, res, "email", rows);
  } catch (e) {
    next(e);
  }
});
router.post("/:id/confirm", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batch = await client.query(
      `SELECT * FROM bank_import_batches WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [req.params.id, req.user.id],
    );
    if (!batch.rowCount) {
      await client.query("ROLLBACK");
      return fail(res, 404, "Import preview not found.");
    }
    const b = batch.rows[0];
    if (b.status !== "preview") {
      await client.query("ROLLBACK");
      return fail(res, 409, "This preview has already been confirmed.");
    }
    let accountId = b.account_id;
    if (b.source_type === "email" && !accountId) {
      // Serialize creation for the same user/bank; avoids duplicate auto-created accounts.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",
        [String(req.user.id), String(b.bank_name).toLowerCase()],
      );
      const existing = await client.query(
        `SELECT id FROM accounts WHERE user_id=$1 AND currency='NGN' AND (LOWER(bank_name)=LOWER($2::text) OR (bank_name IS NULL AND LOWER(name)=LOWER($2::text))) ORDER BY id LIMIT 1 FOR UPDATE`,
        [req.user.id, b.bank_name],
      );
      if (existing.rowCount) accountId = existing.rows[0].id;
      else {
        const created = await client.query(
          `INSERT INTO accounts(user_id,name,currency,balance,notes,color,bank_name) VALUES($1,$2::text,'NGN',0,$3,$4,$2::text) RETURNING id`,
          [
            req.user.id,
            b.bank_name,
            "Created from email alert import",
            "#64748B",
          ],
        );
        accountId = created.rows[0].id;
      }
      await client.query(
        "UPDATE bank_import_batches SET account_id=$1 WHERE id=$2",
        [accountId, b.id],
      );
    }
    const account = await client.query(
      "SELECT id FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [accountId, req.user.id],
    );
    if (!account.rowCount) {
      await client.query("ROLLBACK");
      return fail(res, 404, "Destination account no longer exists.");
    }
    let imported = 0,
      skipped = 0;
    for (const row of b.rows_json) {
      const fingerprint = crypto
        .createHash("sha256")
        .update(
          JSON.stringify([
            b.bank_name,
            row.date,
            row.type,
            row.amount,
            row.description,
            row.reference,
          ]),
        )
        .digest("hex");
      const entry = await client.query(
        `INSERT INTO bank_import_entries(user_id,account_id,fingerprint) VALUES($1,$2,$3) ON CONFLICT(user_id,account_id,fingerprint) DO NOTHING RETURNING id`,
        [req.user.id, accountId, fingerprint],
      );
      if (!entry.rowCount) {
        skipped++;
        continue;
      }
      const transaction = await client.query(
        `INSERT INTO transactions(user_id,account_id,type,amount,description,occurred_on,category_id) VALUES($1,$2,$3,$4,$5,$6,NULL) RETURNING id`,
        [
          req.user.id,
          accountId,
          row.type,
          row.amount,
          row.description,
          row.date,
        ],
      );
      await client.query(
        "UPDATE bank_import_entries SET transaction_id=$1 WHERE id=$2",
        [transaction.rows[0].id, entry.rows[0].id],
      );
      await client.query(
        "UPDATE accounts SET balance=balance+$1,updated_at=NOW() WHERE id=$2",
        [row.type === "income" ? row.amount : -row.amount, accountId],
      );
      imported++;
    }
    await client.query(
      "UPDATE bank_import_batches SET status='confirmed' WHERE id=$1",
      [b.id],
    );
    await client.query("COMMIT");
    return res.json({ imported, skipped, accountId });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});
module.exports = router;
