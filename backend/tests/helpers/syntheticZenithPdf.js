"use strict";

// Entirely synthetic Zenith-style statement for regression testing.
// No real customer details or financial information.
function syntheticZenithPdf() {
  const lines = [];

  const text = (x, y, value) => {
    const escaped = String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    lines.push(`BT /F1 9 Tf 1 0 0 1 ${x} ${y} Tm (${escaped}) Tj ET`);
  };

  text(52, 780, "Zenith Bank");
  text(52, 760, "Synthetic Test Statement");

  const columns = [
    [52, "Date"],
    [111, "Description"],
    [265, "Debit"],
    [339, "Credit"],
    [413, "Value Date"],
    [473, "Balance"],
  ];

  for (const [x, label] of columns) text(x, 730, label);

  const row = (y, date, description, debit, credit, valueDate, balance) => {
    const values = [date, description, debit, credit, valueDate, balance];
    columns.forEach(([x], i) => {
      if (values[i]) text(x, y, values[i]);
    });
  };

  row(705, "", "Opening Balance", "0.00", "0.00", "", "10,000.00");
  row(680, "01/09/2026", "Synthetic Deposit", "0.00", "5,000.00", "01/09/2026", "15,000.00");
  row(655, "02/09/2026", "Synthetic Withdrawal", "2,000.00", "0.00", "02/09/2026", "13,000.00");

  row(625, "", "TOTALS", "-2,000.00", "15,000.00", "", "13,000.00");
  row(600, "", "TOTAL (CLEARED + UNCLEARED)", "-2,000.00", "15,000.00", "", "13,000.00");

  const stream = lines.join("\n") + "\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  return Buffer.from(pdf);
}

module.exports = { syntheticZenithPdf };
