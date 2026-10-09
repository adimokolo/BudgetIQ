"use strict";

const { detectPdfColumns } = require("../../pdfLayout");

function detectUfeColumns(row) {
  const original = detectPdfColumns(row);
  const names = new Set(original.map(item => item.column));

  if (["debit", "credit", "balance"].every(name => names.has(name))) {
    return original;
  }

  const items = (row.items || []).map(item => ({ ...item }));

  // Remove currency suffixes only from recognised monetary
  // header labels, not from transaction values or descriptions.
  const monetaryHeader = /^(debit|credit|balance|running balance|withdrawals?|deposits?)\s*\(?\s*(?:NGN|₦)\s*\)?$/i;

  for (const item of items) {
    const match = monetaryHeader.exec(item.text.trim());

    if (match) {
      item.text = match[1];
    }
  }

  return detectPdfColumns({ ...row, items });
}

module.exports = { detectUfeColumns };
