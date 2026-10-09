"use strict";

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const {
  extractPdfLayout,
  detectPdfColumns,
  extractPdfRowCandidates,
} = require("../src/utils/pdfLayout");

const money = /^(?:₦|NGN)?\s*-?\d[\d,]*\.\d{2}$/i;
const date = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})\b/;

async function audit(file) {
  if (!fs.existsSync(file)) {
    console.log("File not found:", path.basename(file));
    return;
  }

  const pageReports = [];
  const normalisedPages = [];

  await pdfParse(fs.readFileSync(file), {
    pagerender: async page => {
      const content = await page.getTextContent();
      const viewport = page.getViewport(1, page.rotate);
      const [a, b, c, d, e, f] = viewport.transform;
      const groups = new Map();

      for (const item of content.items) {
        const value = String(item.str || "").trim();
        if (!value || !Array.isArray(item.transform)) continue;

        const rawX = item.transform[4];
        const rawY = item.transform[5];
        const x = a * rawX + c * rawY + e;
        const y = b * rawX + d * rawY + f;

        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        const key = Math.round(y * 2) / 2;
        if (!groups.has(key)) groups.set(key, []);

        groups.get(key).push({
          x,
          y,
          text: value,
          width: Number(item.width) || 0,
        });
      }

      const rows = [...groups.entries()].map(([y, items]) => ({
        y,
        items: items.sort((p, q) => p.x - q.x),
      }));

      const detected = new Set();
      let dateRows = 0;
      let moneyRows = 0;
      let combinedRows = 0;
      const monetaryFieldCounts = {};

      for (const row of rows) {
        for (const column of detectPdfColumns(row)) {
          detected.add(column.column);
        }

        const hasDate = row.items.some(i => date.test(i.text));
        const count = row.items.filter(i => money.test(i.text)).length;

        if (hasDate) {
          dateRows++;
          monetaryFieldCounts[count] =
            (monetaryFieldCounts[count] || 0) + 1;
        }

        if (count > 0) moneyRows++;
        if (hasDate && count > 0) combinedRows++;
      }

      const pageNumber = pageReports.length + 1;

      normalisedPages.push({ pageNumber, rows });

      pageReports.push({
        page: pageNumber,
        rotation: page.rotate,
        textItems: content.items.length,
        visualRows: rows.length,
        detectedColumns: [...detected].sort(),
        dateRows,
        moneyRows,
        dateAndMoneyRows: combinedRows,
        monetaryFieldsPerDateRow: monetaryFieldCounts,
      });

      return "";
    },
  });

  const rawPages = await extractPdfLayout(fs.readFileSync(file));

  console.log(JSON.stringify({
    statement: path.basename(file),
    pages: pageReports,
    currentCandidateCount: extractPdfRowCandidates(rawPages).length,
    normalisedCandidateCount:
      extractPdfRowCandidates(normalisedPages).length,
  }, null, 2));
}

(async () => {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log("Provide local PDF paths as arguments.");
    process.exitCode = 1;
    return;
  }

  for (const file of files) {
    try {
      await audit(file);
    } catch (error) {
      console.log(JSON.stringify({
        statement: path.basename(file),
        status: "assessment_failed",
        errorCategory: error?.name || "UnknownError",
      }));
    }
  }
})();
