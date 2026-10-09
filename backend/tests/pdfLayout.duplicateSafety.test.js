const test = require('node:test');
const assert = require('node:assert/strict');

const {
  inspectRepeatedPageSequences
} = require('../src/utils/pdfLayout');

function row(page, reference) {
  return {
    page,
    date: '01-Jan-2026',
    valueDate: '01-Jan-2026',
    reference,
    description: 'Synthetic transaction',
    debit: '100.00',
    credit: '0.00',
    balance: '900.00'
  };
}

test('accepts distinct transaction page sequences', () => {
  const result = inspectRepeatedPageSequences([
    row(1, 'A'),
    row(2, 'B')
  ]);

  assert.equal(result.valid, true);
});

test('rejects identical sequences across pages', () => {
  const result = inspectRepeatedPageSequences([
    row(1, 'A'),
    row(1, 'B'),
    row(2, 'A'),
    row(2, 'B')
  ]);

  assert.equal(result.valid, false);
  assert.equal(result.repeatedPageCount, 1);
});

test('allows identical transactions on the same page', () => {
  const result = inspectRepeatedPageSequences([
    row(1, 'A'),
    row(1, 'A')
  ]);

  assert.equal(result.valid, true);
});

test('allows partially overlapping page sequences', () => {
  const result = inspectRepeatedPageSequences([
    row(1, 'A'),
    row(1, 'B'),
    row(2, 'B'),
    row(2, 'C')
  ]);

  assert.equal(result.valid, true);
});

test('rejects three identical page sequences', () => {
  const result = inspectRepeatedPageSequences([
    row(1, 'A'),
    row(2, 'A'),
    row(3, 'A')
  ]);

  assert.equal(result.valid, false);
  assert.equal(result.repeatedPageCount, 2);
});
