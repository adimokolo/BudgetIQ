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

function makePdf(customLines) {
  const lines = customLines || [
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
      const y = 750 - (
        rowIndex >= 3 ? rowIndex * 30 + 70 : rowIndex * 30
      );

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

test("UFE approves a fully reconciled synthetic statement", async () => {
  const buffer = makePdf([
    ["Date", "Description", "Debit (NGN)", "Credit (NGN)", "Balance (NGN)"],
    ["01-Jan-2026", "Synthetic purchase", "100.00", "", "900.00"],
    ["02-Jan-2026", "Synthetic transfer", "50.00", "", "850.00"],
    ["Opening Balance", "1000.00"],
    ["Closing Balance", "850.00"],
    ["Total Debit", "150.00"],
    ["Total Credit", "0.00"],
  ]);

  const pages = await extractPdfLayout(buffer);
  const legacy = extractPdfRowCandidates(pages);
  const enhanced = extractUfeRowCandidates(pages);

  assert.equal(legacy.length, 0);
  assert.equal(enhanced.length, 2);

  const ledger = validatePdfLedger(enhanced);
  assert.equal(
    ledger.valid,
    true,
    `Synthetic ledger rejected: ${ledger.reason || "unknown"}`
  );

  const result = await prepareValidatedPdfImport(buffer);

  assert.equal(
    result.approved,
    true,
    `Adapter rejected: ${result.reason || "unknown"}`
  );
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map(row => row.amount), [100, 50]);
});
