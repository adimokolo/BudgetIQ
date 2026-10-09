const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assessImportSafety
} = require('../src/utils/pdfLayout');

const valid = {
  ledgerValid: true,
  summaryValid: true,
  datesValid: true,
  repeatedPagesValid: true,
  transactionCount: 2
};

test('approves only when all safety checks pass', () => {
  assert.equal(assessImportSafety(valid).approved, true);
});

test('rejects zero transactions even if other checks pass', () => {
  const result = assessImportSafety({
    ...valid,
    transactionCount: 0
  });

  assert.equal(result.approved, false);
});

test('rejects failed ledger validation', () => {
  assert.equal(
    assessImportSafety({ ...valid, ledgerValid: false }).approved,
    false
  );
});

test('rejects failed independent reconciliation', () => {
  assert.equal(
    assessImportSafety({ ...valid, summaryValid: false }).approved,
    false
  );
});

test('rejects invalid transaction dates', () => {
  assert.equal(
    assessImportSafety({ ...valid, datesValid: false }).approved,
    false
  );
});

test('rejects unverified repeated pages', () => {
  assert.equal(
    assessImportSafety({
      ...valid,
      repeatedPagesValid: false
    }).approved,
    false
  );
});
