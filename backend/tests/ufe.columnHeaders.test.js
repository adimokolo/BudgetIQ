"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractPdfRowCandidates,
  extractUfeRowCandidates,
  detectUfeColumns,
} = require("../src/utils/ufe/interpreters");

function row(y, values) {
  return {
    y,
    items: values.map((text, i) => ({
      text,
      x: 20 + i * 140,
      width: 90,
    })),
  };
}

test("UFE recognises standard monetary headers", () => {
  const columns = detectUfeColumns(row(700, [
    "Date", "Debit", "Credit", "Balance"
  ]));

  assert.deepEqual(
    columns.map(column => column.column),
    ["date", "debit", "credit", "balance"]
  );
});

test("UFE recognises currency-labelled monetary headers", () => {
  const columns = detectUfeColumns(row(700, [
    "Date", "Debit (NGN)", "Credit (NGN)", "Balance (NGN)"
  ]));

  assert.deepEqual(
    columns.map(column => column.column),
    ["date", "debit", "credit", "balance"]
  );
});

test("UFE recognises withdrawal and deposit currency headers", () => {
  const columns = detectUfeColumns(row(700, [
    "Date", "Withdrawal (₦)", "Deposit (₦)",
    "Running Balance (₦)"
  ]));

  assert.deepEqual(
    columns.map(column => column.column),
    ["date", "debit", "credit", "balance"]
  );
});

test("UFE extracts transactions without changing legacy behaviour", () => {
  const pages = [{
    pageNumber: 1,
    rows: [
      row(700, [
        "Date", "Description", "Debit (NGN)",
        "Credit (NGN)", "Balance (NGN)"
      ]),
      row(680, [
        "01-Jan-2026", "Synthetic purchase",
        "100.00", "", "900.00"
      ]),
    ],
  }];

  const legacy = extractPdfRowCandidates(pages);
  const enhanced = extractUfeRowCandidates(pages);

  assert.equal(legacy.length, 0);
  assert.equal(enhanced.length, 1);
  assert.equal(enhanced[0].date, "01-Jan-2026");
  assert.equal(enhanced[0].debit, "100.00");
  assert.equal(enhanced[0].balance, "900.00");
});
