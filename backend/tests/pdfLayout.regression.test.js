const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  extractPdfLayout,
  extractPdfRowCandidates,
  cleanPdfRowCandidates,
  validatePdfLedger,
  extractPdfStatementSummary,
  validatePdfStatementSummary,
  validatePdfTransactionDate,
  inspectRepeatedPageSequences
} = require('../src/utils/pdfLayout');

const cases = [
  { bank: 'uba', count: 2, reconciles: true },
  { bank: 'parallex', count: 40, reconciles: true },
  { bank: 'firstbank', count: 30, reconciles: true },
  { bank: 'fidelity', count: 20, reconciles: false,
    reason: 'Closing balance mismatch' },
  { bank: 'opay', count: 0, reconciles: false }
];

for (const scenario of cases) {
  const file = path.join(
    __dirname, 'private', `${scenario.bank}.pdf`
  );

  test(
    `${scenario.bank}: PDF financial reconciliation`,
    { skip: !fs.existsSync(file) },
    async () => {
      const pages = await extractPdfLayout(fs.readFileSync(file));
      const rawRows = extractPdfRowCandidates(pages);
      const rows = cleanPdfRowCandidates(rawRows);

      assert.equal(rows.length, scenario.count);

      if (scenario.bank === 'parallex') {
        const safety = inspectRepeatedPageSequences(rawRows);

        assert.equal(rawRows.length, 120);
        assert.equal(safety.valid, false);
        assert.equal(safety.repeatedPageCount, 2);
        assert.equal(
          safety.reason,
          'Unverified repeated transaction page sequence'
        );
      }

      if (scenario.bank === 'firstbank') {
        const balanceRecords = pages.flatMap(page => {
          const header = page.rows.find(row => {
            const names = new Set(
              require('../src/utils/pdfLayout')
                .detectPdfColumns(row)
                .map(column => column.column)
            );

            return ['debit', 'credit', 'balance']
              .every(name => names.has(name));
          });

          if (!header) return [];

          return page.rows
            .filter(row => row.y < header.y)
            .map(row => {
              const items = row.items.map(item => item.text);
              const labels = items.join(' ').toLowerCase();
              const monetaryCount = items.filter(value =>
                /^(?:₦|NGN)?\s*-?\d[\d,]*\.\d{2}$/i
                  .test(value.trim())
              ).length;

              return {
                opening: /\bopening\s+balance\b/.test(labels),
                closing: /\bclosing\s+balance\b/.test(labels),
                monetaryCount
              };
            });
        });

        assert.equal(
          balanceRecords.filter(
            row => row.opening && row.monetaryCount === 1
          ).length,
          1,
          'FirstBank must have one opening-balance record'
        );

        assert.equal(
          balanceRecords.filter(
            row => row.closing && row.monetaryCount === 1
          ).length,
          1,
          'FirstBank must have one closing-balance record'
        );

        assert.equal(rows.length, 30);
      }

      if (scenario.reconciles) {
        const validDate = value => {
          const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(
            String(value || '').trim()
          );
          if (!match) return false;

          const months = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
          ];

          const month = months.indexOf(match[2].toLowerCase());
          const year = Number(match[3]);
          const day = Number(match[1]);

          if (month < 0 || year < 1000 || year > 9999) return false;

          const parsed = new Date(Date.UTC(year, month, day));

          return parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month &&
            parsed.getUTCDate() === day;
        };

        for (const row of rows) {
          assert.ok(
            String(row.date || '').trim(),
            `${scenario.bank}: missing transaction date`
          );

          if (scenario.bank === 'uba') {
            assert.ok(validDate(row.date), 'UBA transaction date invalid');
            assert.ok(validDate(row.valueDate), 'UBA value date invalid');
          }

          if (scenario.bank === 'parallex') {
            assert.ok(
              validatePdfTransactionDate(row.date, 'DD/MM/YYYY'),
              'Parallex transaction date invalid'
            );
            assert.ok(
              validatePdfTransactionDate(row.valueDate, 'DD/MM/YYYY'),
              'Parallex value date invalid'
            );
          }

          if (scenario.bank === 'firstbank') {
            assert.ok(
              validatePdfTransactionDate(row.date, 'DD-MMM-YYYY'),
              'FirstBank transaction date invalid'
            );
            assert.ok(
              validatePdfTransactionDate(row.valueDate, 'DD-MMM-YYYY'),
              'FirstBank value date invalid'
            );
          }
        }
      }

      const ledger = validatePdfLedger(rows);
      const extracted = extractPdfStatementSummary(pages);

      const reconciliation =
        ledger.valid && extracted.valid
          ? validatePdfStatementSummary(ledger, extracted.summary)
          : { valid: false, reason: ledger.reason };

      assert.equal(reconciliation.valid, scenario.reconciles);

      if (scenario.reason) {
        assert.equal(reconciliation.reason, scenario.reason);
      }

      if (scenario.reconciles) {
        assert.equal(ledger.valid, true);
        assert.equal(extracted.valid, true);
        assert.ok(
          Object.hasOwn(extracted.summary, 'openingBalanceCents')
        );
        assert.ok(
          Object.hasOwn(extracted.summary, 'closingBalanceCents')
        );
      }
    }
  );
}
