"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { prepareValidatedPdfImport } = require("../src/utils/pdfImportAdapter");
const { extractPdfLayout } = require("../src/utils/pdfLayout");
const {
  extractPdfRowCandidates,
  extractUfeRowCandidates,
} = require("../src/utils/ufe/interpreters");
const { validatePdfLedger } = require("../src/utils/ufe/validation");

function makePdf() {
  const lines = [
    ["Date", "Description", "Debit (NGN)", "Credit (NGN)", "Balance (NGN)"],
    ["01-Jan-2026", "Synthetic purchase", "100.00", "", "900.00"],
    ["02-Jan-2026", "Synthetic transfer", "50.00", "", "825.00"],
  ];

  const xs = [35, 145, 290, 395, 495];
  const operations = ["BT", "/F1 9 Tf"];

  lines.forEach((values, rowIndex) => {
    values.forEach((value, columnIndex) => {
      if (!value) return;

      const escaped = value.replace(/[\\()]/g, "\\$&");
      const y = 750 - rowIndex * 30;

      operations.push(
        `1 0 0 1 ${xs[columnIndex]} ${y} Tm (${escaped}) Tj`
      );
    });
  });

  operations.push("ET");

  const stream = operations.join("\n") + "\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xref = Buffer.byteLength(pdf);

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xref}\n%%EOF\n`;

  return Buffer.from(pdf);
}

test("UFE extracts synthetic rows but rejects invalid ledger", async () => {
  const buffer = makePdf();
  const pages = await extractPdfLayout(buffer);

  const legacy = extractPdfRowCandidates(pages);
  const enhanced = extractUfeRowCandidates(pages);

  assert.equal(legacy.length, 0);
  assert.equal(enhanced.length, 2);
  assert.equal(enhanced[0].debit, "100.00");
  assert.equal(enhanced[0].balance, "900.00");
  assert.equal(enhanced[1].debit, "50.00");
  assert.equal(enhanced[1].balance, "825.00");

  const ledger = validatePdfLedger(enhanced);
  assert.equal(ledger.valid, false);

  const result = await prepareValidatedPdfImport(buffer);

  assert.equal(result.approved, false);
});
