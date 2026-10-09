const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractPdfStatementSummary
} = require('../src/utils/pdfLayout');

function item(text, x, y, width = 70) {
  return { text, x, y, width };
}

function row(y, items) {
  return { y, items };
}

test('does not silently ignore an ambiguous opening balance', () => {
  const pages = [{
    rows: [
      row(700, [
        item('Debit', 200, 700),
        item('Credit', 300, 700),
        item('Balance', 400, 700)
      ]),
      row(650, [
        item('Opening Balance', 20, 650, 120),
        item('100.00', 220, 650),
        item('200.00', 420, 650)
      ]),
      row(600, [
        item('Closing Balance', 20, 600, 120),
        item('300.00', 420, 600)
      ])
    ]
  }];

  const result = extractPdfStatementSummary(pages);

  assert.equal(
    result.valid,
    false,
    'Ambiguous opening balance must invalidate the summary'
  );

  assert.ok(
    result.conflicts.includes('openingBalanceCents'),
    'Opening-balance ambiguity must be reported'
  );
});
