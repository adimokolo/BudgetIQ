"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");

const file = "/mnt/c/Users/DELL/Downloads/GT Bank Statement.pdf";

test("GTBank rotated pages retain reconstructable text rows", {
  skip: !fs.existsSync(file),
}, async () => {
  const reports = [];

  await pdfParse(fs.readFileSync(file), {
    pagerender: async page => {
      const content = await page.getTextContent();
      const viewport = page.getViewport(1, page.rotate);
      const [a, b, c, d, e, f] = viewport.transform;
      const rows = new Map();

      for (const item of content.items) {
        if (!String(item.str || "").trim()) continue;

        const x = item.transform[4];
        const y = item.transform[5];
        const visualY = b * x + d * y + f;

        assert.ok(Number.isFinite(visualY));

        const key = Math.round(visualY * 2) / 2;
        rows.set(key, (rows.get(key) || 0) + 1);
      }

      reports.push({
        rotation: page.rotate,
        rowCount: rows.size,
      });

      return "";
    },
  });

  assert.equal(reports.length, 6);
  assert.ok(reports.every(page => page.rotation === 90));
  assert.ok(reports.every(page => page.rowCount > 0));
});
