"use strict";

/**
 * Extract positioned text rows from a PDF using the existing pdf-parse library.
 *
 * This module performs layout reconstruction only.
 * It does not classify transactions or approve imports.
 */
const pdfParse = require("pdf-parse");

async function extractPdfLayout(buffer) {
  const pages = [];

  await pdfParse(buffer, {
    pagerender: async (page) => {
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });

      const groups = new Map();

      for (const item of content.items) {
        const value = String(item.str || "").trim();
        if (!value || !Array.isArray(item.transform)) continue;

        const x = item.transform[4];
        const y = item.transform[5];

        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        // Group items sharing approximately the same baseline.
        const rowKey = Math.round(y * 2) / 2;

        if (!groups.has(rowKey)) groups.set(rowKey, []);

        groups.get(rowKey).push({
          x,
          y,
          text: value,
          width: Number(item.width) || 0,
        });
      }

      const rows = [...groups.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([y, items]) => ({
          y,
          items: items.sort((a, b) => a.x - b.x),
        }));

      pages.push({
        pageNumber: pages.length + 1,
        rows,
      });

      return "";
    },
  });

  return pages;
}

module.exports = { extractPdfLayout };

const COLUMN_PATTERNS = {
  date: /^(?:trans(?:action)?\s*date|date|posting\s*date)$/i,
  valueDate: /^value\s*date$/i,
  reference: /^(?:ref(?:erence)?\.?(?:\s*(?:number|no))?|transaction\s*ref(?:erence)?)$/i,
  description: /^(?:transaction\s*details|details|description|narration|remarks|particulars)$/i,
  channel: /^channel$/i,
  debit: /^(?:debit|withdrawals?(?:\s*\(?(?:dr)\)?)?|pay\s*out|money\s*out|debit\s*amount)$/i,
  credit: /^(?:credit|deposits?(?:\s*\(?(?:cr)\)?)?|pay\s*in|money\s*in|credit\s*amount)$/i,
  balance: /^(?:balance|running\s*balance|closing\s*balance)$/i,
};

function detectPdfColumns(row) {
  const items = row.items || [];
  const matches = [];

  for (let start = 0; start < items.length; start++) {
    for (let count = 1; count <= 3 && start + count <= items.length; count++) {
      const segment = items.slice(start, start + count);
      const label = segment
        .map(item => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      for (const [column, pattern] of Object.entries(COLUMN_PATTERNS)) {
        if (pattern.test(label)) {
          matches.push({
            column,
            x: segment[0].x,
            xEnd: segment[segment.length - 1].x +
              segment[segment.length - 1].width,
            start,
            count,
          });
        }
      }
    }
  }

  // Prefer longer labels when matches overlap.
  matches.sort((a, b) => b.count - a.count);

  const used = new Set();
  const columns = [];

  for (const match of matches) {
    const positions = Array.from(
      { length: match.count },
      (_, i) => match.start + i
    );

    if (positions.some(position => used.has(position))) continue;

    positions.forEach(position => used.add(position));

    columns.push({
      column: match.column,
      x: Math.round(match.x),
      xEnd: Math.round(match.xEnd),
    });
  }

  return columns.sort((a, b) => a.x - b.x);
}

module.exports.detectPdfColumns = detectPdfColumns;

/**
 * Build dynamic horizontal column regions from detected PDF headers.
 *
 * Monetary values are frequently right-aligned, so subsequent extraction
 * should use text-item extents rather than assuming values begin at the
 * header's x-coordinate.
 */
function buildPdfColumnRegions(columns) {
  const ordered = [...columns].sort((a, b) => a.x - b.x);

  return ordered.map((column, index) => {
    const previous = ordered[index - 1];
    const next = ordered[index + 1];

    const left = previous
      ? (previous.xEnd + column.x) / 2
      : Number.NEGATIVE_INFINITY;

    const right = next
      ? (column.xEnd + next.x) / 2
      : Number.POSITIVE_INFINITY;

    return {
      column: column.column,
      left,
      right,
      headerX: column.x,
      headerEnd: column.xEnd,
    };
  });
}

module.exports.buildPdfColumnRegions = buildPdfColumnRegions;

/**
 * Reconstruct transaction candidates from positioned PDF rows.
 * Candidates are NOT approved transactions: dates, amounts,
 * completeness and running balances must still be validated.
 */
function extractPdfRowCandidates(pages, columnDetector = detectPdfColumns) {
  const candidates = [];

  for (const page of pages) {
    let regions = null;

    for (const row of page.rows) {
      const columns = columnDetector(row);
      const names = new Set(columns.map(c => c.column));

      if (
        names.has("balance") &&
        names.has("debit") &&
        names.has("credit")
      ) {
        regions = buildPdfColumnRegions(columns);
        continue;
      }

      if (!regions) continue;

      const fields = {};

      for (const item of row.items) {
        const midpoint = item.x + item.width / 2;
        const region = regions.find(r =>
          midpoint >= r.left && midpoint < r.right
        );

        if (!region) continue;

        (fields[region.column] ||= []).push(item.text);
      }

      const amountPattern =
        /^(?:₦|NGN)?\s*-?\d[\d,]*\.\d{2}$/i;

      const monetary = {};

      for (const name of ["debit", "credit", "balance"]) {
        const values = (fields[name] || [])
          .filter(value => amountPattern.test(value.trim()));

        if (values.length > 1) {
          monetary[name] = null;
        } else {
          monetary[name] = values[0] || null;
        }
      }

      // Require a running balance and at least one transaction
      // amount. Standalone opening/closing balances are excluded.
      if (
        !monetary.balance ||
        (!monetary.debit && !monetary.credit)
      ) continue;

      let transactionDate = (fields.date || []).join(" ").trim();
      let valueDate = (fields.valueDate || []).join(" ").trim();

      // Fallback for PDFs whose date headers are not recognised.
      // Accept only two valid, separate dates preceding the first
      // monetary column on the same transaction row.
      if (!transactionDate && !valueDate) {
        const firstMoneyColumn = regions
          .filter(region =>
            ["debit", "credit", "balance"].includes(region.column)
          )
          .reduce(
            (minimum, region) => Math.min(minimum, region.headerX),
            Number.POSITIVE_INFINITY
          );

        const months = [
          "jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"
        ];

        const validDate = value => {
          const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(
            value.trim()
          );

          if (!match) return false;

          const day = Number(match[1]);
          const month = months.indexOf(match[2].toLowerCase());
          const year = Number(match[3]);

          if (month < 0 || year < 1000 || year > 9999) {
            return false;
          }

          const parsed = new Date(Date.UTC(year, month, day));

          return parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month &&
            parsed.getUTCDate() === day;
        };

        const dateItems = row.items
          .filter(item =>
            item.x + item.width <= firstMoneyColumn &&
            validDate(item.text)
          )
          .sort((a, b) => a.x - b.x);

        if (dateItems.length === 2) {
          transactionDate = dateItems[0].text.trim();
          valueDate = dateItems[1].text.trim();
        }
      }

      candidates.push({
        page: page.pageNumber,
        y: row.y,
        date: transactionDate,
        valueDate: valueDate,
        reference: (fields.reference || []).join(" ").trim(),
        description: (fields.description || []).join(" ").trim(),
        debit: monetary.debit,
        credit: monetary.credit,
        balance: monetary.balance,
      });
    }
  }

  return candidates;
}

module.exports.extractPdfRowCandidates = extractPdfRowCandidates;

/**
 * Validate a sequence of positioned PDF transaction candidates.
 * This checks internal ledger arithmetic only; it does not verify
 * printed statement summaries or approve an import.
 */
function validatePdfLedger(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, reason: "No transaction candidates" };
  }

  function toCents(value) {
    if (value == null || String(value).trim() === "") return 0;

    const cleaned = String(value).replace(/[₦,\s]/g, "");
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;

    const number = Number(cleaned);
    if (!Number.isFinite(number)) return null;

    return Math.round(number * 100);
  }

  let previousBalance = null;
  let openingBalance = null;
  let debitTotal = 0;
  let creditTotal = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];

    if (row.balance == null || String(row.balance).trim() === "") {
      return { valid: false, reason: "Missing running balance", index };
    }

    const debit = toCents(row.debit);
    const credit = toCents(row.credit);
    const balance = toCents(row.balance);

    if ([debit, credit, balance].some(value => value === null)) {
      return { valid: false, reason: "Invalid monetary value", index };
    }

    if (debit < 0 || credit < 0) {
      return { valid: false, reason: "Negative debit or credit", index };
    }

    if ((debit > 0) === (credit > 0)) {
      return { valid: false, reason: "Ambiguous transaction direction", index };
    }

    const movement = credit - debit;

    if (index === 0) {
      openingBalance = balance - movement;
    } else if (previousBalance + movement !== balance) {
      return { valid: false, reason: "Running balance mismatch", index };
    }

    previousBalance = balance;
    debitTotal += debit;
    creditTotal += credit;
  }

  return {
    valid: true,
    transactionCount: rows.length,
    openingBalanceCents: openingBalance,
    closingBalanceCents: previousBalance,
    debitTotalCents: debitTotal,
    creditTotalCents: creditTotal
  };
}

module.exports.validatePdfLedger = validatePdfLedger;

/**
 * Compare a validated ledger against independently obtained
 * statement-summary figures.
 *
 * All summary amounts must be supplied as integer cents.
 * This function does not extract summaries from PDF text.
 */
function validatePdfStatementSummary(ledger, summary) {
  if (!ledger?.valid) {
    return { valid: false, reason: "Ledger validation required" };
  }

  if (!summary || typeof summary !== "object") {
    return { valid: false, reason: "Statement summary missing" };
  }

  const comparisons = [
    ["openingBalanceCents", "Opening balance mismatch"],
    ["closingBalanceCents", "Closing balance mismatch"],
    ["debitTotalCents", "Debit total mismatch"],
    ["creditTotalCents", "Credit total mismatch"],
  ];

  let checked = 0;

  for (const [field, reason] of comparisons) {
    if (summary[field] == null) continue;

    const value = summary[field];

    if (!Number.isSafeInteger(value)) {
      return { valid: false, reason: "Invalid statement summary", field };
    }

    checked++;

    if (ledger[field] !== value) {
      return { valid: false, reason, field };
    }
  }

  // Require independent opening and closing balance evidence.
  if (
    summary.openingBalanceCents == null ||
    summary.closingBalanceCents == null
  ) {
    return { valid: false, reason: "Incomplete statement summary" };
  }

  return { valid: true, checkedFields: checked };
}

module.exports.validatePdfStatementSummary = validatePdfStatementSummary;

/**
 * Extract independently printed statement-summary figures.
 * Does not derive values from transaction candidates.
 */
function extractPdfStatementSummary(pages) {
  const patterns = {
    openingBalanceCents: /\bopening(?:\s+balance)?\b/i,
    closingBalanceCents: /\bclosing(?:\s+balance)?\b/i,
    debitTotalCents: /\btotal\s+debit\b/i,
    creditTotalCents: /\btotal\s+credit\b/i,
  };

  const moneyPattern =
    /^(?:₦|NGN)?\s*-?\d[\d,]*\.\d{2}$/i;

  const summary = {};
  const conflicts = [];

  for (const page of pages) {
    const headers = page.rows
      .filter(row => {
        const columns = detectPdfColumns(row);
        return ["debit", "credit", "balance"].every(
          name => columns.some(column => column.column === name)
        );
      })
      .map(row => row.y);

    for (const row of page.rows) {
      // Do not exclude entire regions below transaction headers:
      // legitimate opening/closing summaries may appear there.
      // Ambiguous transaction-table rows are rejected below using
      // their monetary-value matches.

      for (const [field, pattern] of Object.entries(patterns)) {
        const labels = row.items.filter(item =>
          pattern.test(item.text)
        );

        if (!labels.length) continue;

        for (const label of labels) {
          // Exclude ambiguous opening-balance table rows only when
          // multiple monetary columns occur beside the label.
          // Do not exclude genuine summaries solely by their position.
          if (field === "openingBalanceCents") {
            const belowHeader = headers.some(
              headerY => row.y < headerY
            );

            const nearbyAmounts = page.rows.flatMap(candidateRow =>
              candidateRow.items.filter(item =>
                Math.abs(item.y - label.y) <= 2 &&
                item.x >= label.x + label.width &&
                moneyPattern.test(item.text.trim())
              )
            );

            if (belowHeader && nearbyAmounts.length > 1) {
              const monetaryItems = row.items.filter(item =>
                moneyPattern.test(item.text.trim())
              );

              const headerRow = page.rows.find(candidate =>
                candidate.y > row.y &&
                ["debit", "credit", "balance"].every(name =>
                  detectPdfColumns(candidate).some(
                    column => column.column === name
                  )
                )
              );

              const regions = headerRow
                ? buildPdfColumnRegions(
                    detectPdfColumns(headerRow)
                  )
                : [];

              const monetaryColumns = monetaryItems.map(item => {
                const region = regions.find(region =>
                  item.x >= region.left &&
                  item.x < region.right
                );
                return region?.column;
              });

              const isTableOpeningRow =
                summary.openingBalanceCents !== undefined &&
                monetaryItems.length === 3 &&
                ["debit", "credit", "balance"].every(
                  name => monetaryColumns.includes(name)
                );

              if (isTableOpeningRow) {
                continue;
              }

              conflicts.push(field);
              continue;
            }
          }

          const labelEnd = label.x + label.width;

          const values = page.rows.flatMap(candidateRow =>
            candidateRow.items.filter(item =>
              Math.abs(item.y - label.y) <= 2 &&
              item.x >= labelEnd &&
              moneyPattern.test(item.text.trim())
            )
          );

          if (values.length !== 1) {
            conflicts.push(field);
            continue;
          }

          const cents = Math.round(
            Number(
              values[0].text.replace(/₦|NGN|,|\s/gi, "")
            ) * 100
          );

          if (!Number.isSafeInteger(cents)) {
            conflicts.push(field);
            continue;
          }

          if (summary[field] !== undefined) {
            if (summary[field] !== cents) {
              conflicts.push(field);
            }
            continue;
          }

          summary[field] = cents;
        }
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    summary,
    conflicts: [...new Set(conflicts)],
  };
}

module.exports.extractPdfStatementSummary =
  extractPdfStatementSummary;

/**
 * Remove non-monetary candidates and repeated complete page datasets.
 * Preserve identical transactions within a page.
 */
function cleanPdfRowCandidates(rows) {
  const amount = value => {
    const text = String(value ?? "0")
      .replace(/₦|NGN|,/gi, "")
      .trim();
    return Number(text || "0");
  };

  const monetary = rows.filter(row => {
    const debit = amount(row.debit);
    const credit = amount(row.credit);

    // Retain ambiguous/invalid monetary rows for the ledger validator
    // to reject. Exclude only rows with two valid zero amounts.
    return !(
      Number.isFinite(debit) &&
      Number.isFinite(credit) &&
      debit === 0 &&
      credit === 0
    );
  });

  const byPage = new Map();

  for (const row of monetary) {
    const page = row.page;

    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page).push(row);
  }

  const seenPageSequences = new Set();
  const cleaned = [];

  for (const pageRows of byPage.values()) {
    const signature = JSON.stringify(
      pageRows.map(row => [
        row.date,
        row.valueDate,
        row.reference,
        row.description,
        row.debit,
        row.credit,
        row.balance
      ])
    );

    if (seenPageSequences.has(signature)) continue;

    seenPageSequences.add(signature);
    cleaned.push(...pageRows);
  }

  return cleaned;
}

module.exports.cleanPdfRowCandidates = cleanPdfRowCandidates;


/**
 * Validate an unambiguous DD-MMM-YYYY calendar date.
 * Numeric slash-separated dates require an independently established
 * day/month convention and are not accepted here.
 */
function validatePdfTransactionDate(value, format = "DD-MMM-YYYY") {
  if (typeof value !== "string") return false;

  const text = value.trim();
  let day;
  let month;
  let year;

  if (format === "DD-MMM-YYYY") {
    const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(text);
    if (!match) return false;

    const months = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];

    day = Number(match[1]);
    month = months.indexOf(match[2].toLowerCase());
    year = Number(match[3]);

  } else if (format === "DD/MM/YYYY") {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!match) return false;

    day = Number(match[1]);
    month = Number(match[2]) - 1;
    year = Number(match[3]);

  } else {
    return false;
  }

  if (
    month < 0 ||
    month > 11 ||
    year < 1000 ||
    year > 9999 ||
    day < 1
  ) return false;

  const parsed = new Date(Date.UTC(year, month, day));

  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month &&
    parsed.getUTCDate() === day;
}

module.exports.validatePdfTransactionDate =
  validatePdfTransactionDate;


/**
 * Detect identical transaction sequences across different PDF pages.
 * Repetition is ambiguous until independently verified.
 * Never silently authorise deduplication based on this check.
 */
function inspectRepeatedPageSequences(rows) {
  const pages = new Map();

  for (const row of rows) {
    if (!pages.has(row.page)) pages.set(row.page, []);

    pages.get(row.page).push([
      row.date,
      row.valueDate,
      row.reference,
      row.description,
      row.debit,
      row.credit,
      row.balance
    ]);
  }

  const seen = new Map();
  const repeated = [];

  for (const [page, transactions] of pages) {
    const signature = JSON.stringify(transactions);

    if (seen.has(signature)) {
      repeated.push({
        firstPage: seen.get(signature),
        repeatedPage: page,
        transactionCount: transactions.length
      });
    } else {
      seen.set(signature, page);
    }
  }

  return {
    valid: repeated.length === 0,
    reason: repeated.length
      ? 'Unverified repeated transaction page sequence'
      : null,
    repeatedPageCount: repeated.length
  };
}

module.exports.inspectRepeatedPageSequences =
  inspectRepeatedPageSequences;


/**
 * Preliminary fail-closed PDF import safety decision.
 * This is not yet the complete production import gate.
 */
function assessImportSafety({
  ledgerValid,
  summaryValid,
  datesValid,
  repeatedPagesValid,
  transactionCount
}) {
  if (!Number.isSafeInteger(transactionCount) ||
      transactionCount <= 0) {
    return { approved: false, reason: 'No valid transactions' };
  }

  if (!ledgerValid) {
    return { approved: false, reason: 'Ledger validation failed' };
  }

  if (!summaryValid) {
    return { approved: false, reason: 'Statement reconciliation failed' };
  }

  if (!datesValid) {
    return { approved: false, reason: 'Transaction date validation failed' };
  }

  if (!repeatedPagesValid) {
    return {
      approved: false,
      reason: 'Unverified repeated transaction page sequence'
    };
  }

  return { approved: true, reason: null };
}


module.exports.assessImportSafety = assessImportSafety;
