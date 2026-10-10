"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const { extractPdfLayout } = require("../src/utils/ufe").layout;
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

const fixture = "/tmp/kashmetrix-bank-validation/ZENITH Statement.pdf";
const available = fs.existsSync(fixture);

async function loadStatement() {
  return extractPdfLayout(fs.readFileSync(fixture));
}

test("Zenith: production import approves 31 transactions",
  { skip: !available }, async () => {
    const result = await prepareValidatedPdfImport(
      fs.readFileSync(fixture)
    );

    assert.equal(result.approved, true);
    assert.equal(result.rows.length, 31);
  }
);

test("Zenith: dedicated summary reconciles with ledger",
  { skip: !available }, async () => {
    const pages = await loadStatement();

    assert.equal(isZenithStatement(pages), true);

    const candidates = extractZenithCandidates(pages);
    assert.equal(candidates?.length, 31);

    const ledger = validatePdfLedger(candidates);
    const summary = extractZenithSummary(pages);

    assert.equal(ledger.valid, true);
    assert.equal(summary.valid, true);
    assert.equal(
      validatePdfStatementSummary(ledger, summary.summary).valid,
      true
    );
  }
);

for (const [name, field] of [
  ["incorrect closing balance", "closingBalanceCents"],
  ["incorrect credit total", "creditTotalCents"],
  ["incorrect debit total", "debitTotalCents"],
  ["incorrect opening balance", "openingBalanceCents"],
]) {
  test(`Zenith: rejects ${name}`,
    { skip: !available }, async () => {
      const pages = await loadStatement();
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
    }
  );
}

test("Zenith: rejects missing final totals row",
  { skip: !available }, async () => {
    const pages = structuredClone(await loadStatement());
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

    assert.ok(removed > 0, "Final totals row must be present");
    assert.equal(extractZenithCandidates(pages), null);
  }
);
