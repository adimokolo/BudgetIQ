const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const parser = require('../src/routes/bankImport')._test;

const privateDir = path.join(__dirname, 'private');

async function parseStatement(bank) {
  const file = path.join(privateDir, `${bank}.pdf`);
  const pdf = await pdfParse(fs.readFileSync(file));
  const rows = parser.parsePdfTransactions(pdf.text);

  const totalCents = (type) =>
    rows
      .filter((row) => row.type === type)
      .reduce((sum, row) => sum + Math.round(row.amount * 100), 0);

  return {
    rows,
    incomeCount: rows.filter((row) => row.type === 'income').length,
    expenseCount: rows.filter((row) => row.type === 'expense').length,
    incomeCents: totalCents('income'),
    expenseCents: totalCents('expense'),
    distinctTables: parser.hasDistinctPdfTransactionTables(pdf.text),
  };
}

test('UBA PDF regression', async () => {
  const result = await parseStatement('uba');

  assert.equal(result.rows.length, 2);
  assert.equal(result.incomeCount, 1);
  assert.equal(result.expenseCount, 1);
  assert.equal(result.incomeCents, 150);
  assert.equal(result.expenseCents, 15);
});

test('Parallex PDF regression', async () => {
  const result = await parseStatement('parallex');

  assert.equal(result.rows.length, 40);
  assert.equal(result.incomeCount, 4);
  assert.equal(result.expenseCount, 36);
  assert.equal(result.incomeCents, 21935000);
  assert.equal(result.expenseCents, 3831463528);
  assert.equal(result.distinctTables, false);
});

test('OPay distinct transaction sections remain unsupported', async () => {
  const result = await parseStatement('opay');

  assert.equal(result.distinctTables, true);
  assert.equal(result.rows.length, 0);
});

test('FirstBank PDF extracts all 32 transactions with correct totals', async () => {
  const result = await parseStatement('firstbank');

  assert.equal(result.rows.length, 32);
  assert.equal(result.expenseCents, 34185530);
  assert.equal(result.incomeCents, 28780000);
});

test('Fidelity PDF extracts all 20 transaction rows', async () => {
  const result = await parseStatement('fidelity');

  assert.equal(result.rows.length, 20);
});
