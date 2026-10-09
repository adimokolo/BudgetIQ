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

      // Two-date transaction rows are strong completeness evidence.
      // A single-date row is also considered when it contains at least
      // two separate monetary-looking fields, reducing false positives
      // from ordinary narrative lines.
      const monetaryFields = (row.items || []).filter(item => {
        const text = String(item.text || "").trim();
        return /^(?:₦\s*)?(?:\d+(?:\.\d{2})?|\d{1,3}(?:,\d{3})+\.\d{2})$/.test(text);
      });

      const transactionLike =
        dates.length === 2 ||
        (dates.length === 1 && monetaryFields.length >= 2);

      if (!transactionLike) continue;

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
