"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { syntheticZenithPdf } = require("./helpers/syntheticZenithPdf");
const { extractPdfLayout } = require("../src/utils/pdfLayout");
const { prepareValidatedPdfImport } =
  require("../src/utils/pdfImportAdapter");
const {
  isZenithStatement,
  extractZenithCandidates,
  extractZenithSummary,
} = require("../src/utils/ufe/interpreters/zenithPdfAdapter");
const {
  validatePdfLedger,
  validatePdfStatementSummary,
} = require("../src/utils/pdfLayout");

test("Synthetic Zenith: production importer approves two transactions", async () => {
  const result = await prepareValidatedPdfImport(syntheticZenithPdf());

  assert.equal(result.approved, true);
  assert.equal(result.rows.length, 2);
});

test("Synthetic Zenith: statement identification and reconciliation", async () => {
  const pages = await extractPdfLayout(syntheticZenithPdf());

  assert.equal(isZenithStatement(pages), true);

  const candidates = extractZenithCandidates(pages);
  assert.equal(candidates?.length, 2);

  const ledger = validatePdfLedger(candidates);
  const summary = extractZenithSummary(pages);

  assert.equal(ledger.valid, true);
  assert.equal(summary.valid, true);
  assert.equal(
    validatePdfStatementSummary(ledger, summary.summary).valid,
    true
  );
});

for (const [name, field] of [
  ["closing balance", "closingBalanceCents"],
  ["credit total", "creditTotalCents"],
  ["debit total", "debitTotalCents"],
  ["opening balance", "openingBalanceCents"],
]) {
  test(`Synthetic Zenith: rejects incorrect ${name}`, async () => {
    const pages = await extractPdfLayout(syntheticZenithPdf());
    const candidates = extractZenithCandidates(pages);
    const ledger = validatePdfLedger(candidates);
    const extracted = extractZenithSummary(pages);

    assert.equal(ledger.valid, true);
    assert.equal(extracted.valid, true);

    const altered = {
      ...extracted.summary,
      [field]: extracted.summary[field] + 1,
    };

    assert.equal(
      validatePdfStatementSummary(ledger, altered).valid,
      false
    );
  });
}

test("Synthetic Zenith: rejects missing final totals row", async () => {
  const pages = structuredClone(
    await extractPdfLayout(syntheticZenithPdf())
  );

  let removed = 0;

  for (const page of pages) {
    page.rows = (page.rows || []).filter(row => {
      const content = (row.items || [])
        .map(item => String(item.text || ""))
        .join(" ");

      if (/TOTAL\s*\(\s*CLEARED\s*\+\s*UNCLEARED\s*\)/i.test(content)) {
        removed++;
        return false;
      }

      return true;
    });
  }

  assert.ok(removed > 0);
  assert.equal(extractZenithCandidates(pages), null);
});
