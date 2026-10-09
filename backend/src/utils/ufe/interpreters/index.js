"use strict";

// UFE bank-format interpretation layer.
// Preserve existing extraction behaviour during migration.

const { extractPdfRowCandidates } = require("../../pdfLayout");
const { extractGtbankPdf } = require("../../gtbankPdfAdapter");

module.exports = {
  extractPdfRowCandidates,
  extractGtbankPdf,
};
