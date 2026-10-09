"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePdfLedger } = require("../src/utils/pdfLayout");

const validRows = [
  { debit: "10.00", credit: "0.00", balance: "90.00" },
  { debit: "0.00", credit: "25.00", balance: "115.00" },
  { debit: "5.00", credit: "0.00", balance: "110.00" }
];

test("accepts a reconciled transaction sequence", () => {
  const result = validatePdfLedger(validRows);

  assert.equal(result.valid, true);
  assert.equal(result.transactionCount, 3);
  assert.equal(result.openingBalanceCents, 10000);
  assert.equal(result.closingBalanceCents, 11000);
  assert.equal(result.debitTotalCents, 1500);
  assert.equal(result.creditTotalCents, 2500);
});

test("rejects a broken running balance", () => {
  const rows = validRows.map(row => ({ ...row }));
  rows[1].balance = "116.00";

  const result = validatePdfLedger(rows);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Running balance mismatch");
});

test("rejects simultaneous positive debit and credit", () => {
  const rows = validRows.map(row => ({ ...row }));
  rows[1].debit = "2.00";

  const result = validatePdfLedger(rows);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Ambiguous transaction direction");
});

test("rejects invalid monetary values", () => {
  const rows = validRows.map(row => ({ ...row }));
  rows[1].credit = "not-a-number";

  const result = validatePdfLedger(rows);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Invalid monetary value");
});

test("rejects an empty transaction sequence", () => {
  const result = validatePdfLedger([]);

  assert.equal(result.valid, false);
});

test("rejects a missing running balance", () => {
  const rows = validRows.map(row => ({ ...row }));
  delete rows[1].balance;

  const result = validatePdfLedger(rows);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Missing running balance");
});

const { validatePdfStatementSummary } =
  require("../src/utils/pdfLayout");

test("accepts matching independent statement totals", () => {
  const ledger = validatePdfLedger(validRows);

  const result = validatePdfStatementSummary(ledger, {
    openingBalanceCents: 10000,
    closingBalanceCents: 11000,
    debitTotalCents: 1500,
    creditTotalCents: 2500
  });

  assert.equal(result.valid, true);
  assert.equal(result.checkedFields, 4);
});

test("rejects a closing balance discrepancy of 752 kobo", () => {
  const ledger = validatePdfLedger(validRows);

  const result = validatePdfStatementSummary(ledger, {
    openingBalanceCents: 10000,
    closingBalanceCents: 10248,
    debitTotalCents: 1500,
    creditTotalCents: 2500
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Closing balance mismatch");
});

test("rejects an incorrect debit total", () => {
  const ledger = validatePdfLedger(validRows);

  const result = validatePdfStatementSummary(ledger, {
    openingBalanceCents: 10000,
    closingBalanceCents: 11000,
    debitTotalCents: 1600,
    creditTotalCents: 2500
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Debit total mismatch");
});

test("rejects incomplete statement summaries", () => {
  const ledger = validatePdfLedger(validRows);

  const result = validatePdfStatementSummary(ledger, {
    openingBalanceCents: 10000
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Incomplete statement summary");
});

test("rejects summary validation without a valid ledger", () => {
  const result = validatePdfStatementSummary(
    { valid: false },
    {
      openingBalanceCents: 10000,
      closingBalanceCents: 11000
    }
  );

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Ledger validation required");
});
