"use strict";

const pdfParse = require("pdf-parse");

const MONEY = /^(?:₦|NGN)?\s*-?(?:\d[\d,]*|\d*)\.\d{2}$/i;
const DATE = /^\d{2}-[A-Za-z]{3}-\d{4}$/;
const COLUMNS = { debit: 260, credit: 340, balance: 420 };

function cents(text) {
  if (!MONEY.test(String(text || "").trim())) return null;
  const value = Number(String(text).replace(/[₦,\s]/g, ""));
  const result = Math.round(value * 100);
  return Number.isSafeInteger(result) ? result : null;
}

function field(items, target) {
  const matches = items.filter(item =>
    MONEY.test(item.text) &&
    Math.abs(item.x - target) <= 15
  );
  return matches.length === 1 ? matches[0].text : null;
}

async function extractGtbankPdf(buffer) {
  const pages = [];

  await pdfParse(buffer, {
    pagerender: async page => {
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });

      const t = page.getViewport(1, page.rotate).transform;
      const groups = new Map();

      for (const item of content.items) {
        const value = String(item.str || "").trim();
        if (!value || !Array.isArray(item.transform)) continue;

        const x = t[0] * item.transform[4] +
                  t[2] * item.transform[5] + t[4];
        const y = t[1] * item.transform[4] +
                  t[3] * item.transform[5] + t[5];

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

      const rows = [...groups.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([y, items]) => ({
          y,
          items: items.sort((a, b) => a.x - b.x),
        }));

      pages.push({
        pageNumber: pages.length + 1,
        rotation: page.rotate,
        rows,
      });

      return "";
    },
  });

  const candidates = [];
  const incompleteRows = [];

  for (const page of pages) {
    for (const row of page.rows) {
      const dates = row.items
        .filter(item => DATE.test(item.text))
        .sort((a, b) => a.x - b.x);

      if (dates.length !== 2) continue;

      const debit = field(row.items, COLUMNS.debit);
      const credit = field(row.items, COLUMNS.credit);
      const balance = field(row.items, COLUMNS.balance);

      const hasDebit = cents(debit) !== null;
      const hasCredit = cents(credit) !== null;
      const hasBalance = cents(balance) !== null;

      if (!hasBalance || hasDebit === hasCredit) {
        incompleteRows.push({
          page: page.pageNumber,
          y: row.y,
        });
        continue;
      }

      const reference = row.items
        .filter(item => item.x > 150 && item.x < 250)
        .map(item => item.text)
        .join(" ")
        .trim();

      candidates.push({
        page: page.pageNumber,
        y: row.y,
        date: dates[0].text,
        valueDate: dates[1].text,
        reference,
        description: "GTBank transaction",
        debit: debit?.startsWith(".") ? `0${debit}` : debit,
        credit: credit?.startsWith(".") ? `0${credit}` : credit,
        balance: balance?.startsWith(".") ? `0${balance}` : balance,
      });
    }
  }

  return {
    pages,
    candidates,
    incompleteRowCount: incompleteRows.length,
  };
}

module.exports = { extractGtbankPdf };
