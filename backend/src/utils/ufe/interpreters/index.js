"use strict";

// UFE bank-format interpretation layer.
// Preserve the existing extraction path alongside enhanced recognition.

const { extractPdfRowCandidates } = require("../../pdfLayout");
const { extractGtbankPdf } = require("../../gtbankPdfAdapter");
const { detectUfeColumns } = require("./columnHeaders");

function extractUfeRowCandidates(pages) {
  return extractPdfRowCandidates(pages, detectUfeColumns);
}

module.exports = {
  extractPdfRowCandidates,
  extractGtbankPdf,
  detectUfeColumns,
  extractUfeRowCandidates,
};
