"use strict";

const DATE = /^\d{2}-[A-Za-z]{3}-\d{4}$/;

function assessExtractionCompleteness(pages, candidates) {
  const extracted = new Set(
    candidates.map(candidate => `${candidate.page}:${candidate.y}`)
  );

  const unmatched = [];

  for (const page of pages) {
    for (const row of page.rows || []) {
      const dates = (row.items || [])
        .filter(item => DATE.test(String(item.text || "").trim()));

      // Only assess rows containing two distinct date fields.
      // This deliberately avoids treating narrative lines as transactions.
      if (dates.length !== 2) continue;

      const key = `${page.pageNumber}:${row.y}`;

      if (!extracted.has(key)) {
        unmatched.push({
          page: page.pageNumber,
          y: row.y,
        });
      }
    }
  }

  return {
    complete: unmatched.length === 0,
    unmatchedCount: unmatched.length,
  };
}

module.exports = { assessExtractionCompleteness };
