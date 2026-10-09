const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validatePdfTransactionDate
} = require('../src/utils/pdfLayout');

test('accepts valid DD-MMM-YYYY dates', () => {
  assert.equal(validatePdfTransactionDate('08-Oct-2026'), true);
  assert.equal(validatePdfTransactionDate('29-Feb-2024'), true);
  assert.equal(validatePdfTransactionDate('31-Dec-2025'), true);
  assert.equal(validatePdfTransactionDate('01-jan-2026'), true);
});

test('rejects impossible calendar dates', () => {
  assert.equal(validatePdfTransactionDate('31-Feb-2026'), false);
  assert.equal(validatePdfTransactionDate('29-Feb-2025'), false);
  assert.equal(validatePdfTransactionDate('31-Apr-2026'), false);
  assert.equal(validatePdfTransactionDate('00-Jan-2026'), false);
  assert.equal(validatePdfTransactionDate('32-Jan-2026'), false);
});

test('rejects malformed or ambiguous dates', () => {
  assert.equal(validatePdfTransactionDate('08/10/2026'), false);
  assert.equal(validatePdfTransactionDate('2026-10-08'), false);
  assert.equal(validatePdfTransactionDate('08-XYZ-2026'), false);
  assert.equal(validatePdfTransactionDate('08-Oct-26'), false);
  assert.equal(validatePdfTransactionDate(''), false);
  assert.equal(validatePdfTransactionDate(null), false);
  assert.equal(validatePdfTransactionDate(undefined), false);
});

test('rejects multiple dates in one field', () => {
  assert.equal(
    validatePdfTransactionDate('08-Oct-2026 09-Oct-2026'),
    false
  );
});
