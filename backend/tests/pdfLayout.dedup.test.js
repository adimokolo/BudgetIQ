const test = require('node:test');
const assert = require('node:assert/strict');

const {
  cleanPdfRowCandidates
} = require('../src/utils/pdfLayout');

function transaction(page, reference, balance) {
  return {
    page,
    date: '01-Jan-2026',
    valueDate: '01-Jan-2026',
    reference,
    description: 'Synthetic test transaction',
    debit: '100.00',
    credit: '0.00',
    balance
  };
}

test('preserves identical transactions on the same page', () => {
  const row = transaction(1, 'TEST-001', '900.00');

  const result = cleanPdfRowCandidates([
    row,
    { ...row }
  ]);

  assert.equal(result.length, 2);
});

test('documents identical page-sequence deduplication', () => {
  const rows = [
    transaction(1, 'TEST-001', '900.00'),
    transaction(1, 'TEST-002', '800.00'),
    transaction(2, 'TEST-001', '900.00'),
    transaction(2, 'TEST-002', '800.00')
  ];

  const result = cleanPdfRowCandidates(rows);

  assert.equal(result.length, 2);
});

test('preserves partially overlapping page sequences', () => {
  const rows = [
    transaction(1, 'TEST-001', '900.00'),
    transaction(1, 'TEST-002', '800.00'),
    transaction(2, 'TEST-002', '800.00'),
    transaction(2, 'TEST-003', '700.00')
  ];

  const result = cleanPdfRowCandidates(rows);

  assert.equal(result.length, 4);
});

test('preserves distinct transactions across pages', () => {
  const result = cleanPdfRowCandidates([
    transaction(1, 'TEST-001', '900.00'),
    transaction(2, 'TEST-002', '800.00')
  ]);

  assert.equal(result.length, 2);
});
