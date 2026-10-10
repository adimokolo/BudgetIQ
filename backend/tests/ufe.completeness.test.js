"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assessExtractionCompleteness,
} = require("../src/utils/ufe/validation/completeness");

const pages = [{
  pageNumber: 1,
  rows: [
    {
      y: 100,
      items: [
        { text: "01-Jan-2026" },
        { text: "02-Jan-2026" },
        { text: "Synthetic transaction A" },
      ],
    },
    {
      y: 120,
      items: [
        { text: "03-Jan-2026" },
        { text: "04-Jan-2026" },
        { text: "Synthetic transaction B" },
      ],
    },
    {
      y: 140,
      items: [{ text: "Statement summary" }],
    },
  ],
}];

test("UFE accepts complete extraction evidence", () => {
  const candidates = [
    { page: 1, y: 100 },
    { page: 1, y: 120 },
  ];

  assert.deepEqual(
    assessExtractionCompleteness(pages, candidates),
    { complete: true, unmatchedCount: 0 }
  );
});

test("UFE detects an omitted transaction row", () => {
  const candidates = [{ page: 1, y: 100 }];

  assert.deepEqual(
    assessExtractionCompleteness(pages, candidates),
    { complete: false, unmatchedCount: 1 }
  );
});

test("UFE ignores ordinary narrative rows", () => {
  const candidates = [
    { page: 1, y: 100 },
    { page: 1, y: 120 },
  ];

  assert.equal(
    assessExtractionCompleteness(pages, candidates).unmatchedCount,
    0
  );
});


test("UFE detects omitted single-date transaction rows", () => {
  const pages = [{
    pageNumber: 1,
    rows: [{
      y: 100,
      items: [
        { text: "01-Jan-2026" },
        { text: "Synthetic purchase" },
        { text: "100.00" },
        { text: "900.00" },
      ],
    }],
  }];

  const result = assessExtractionCompleteness(pages, []);

  assert.equal(result.complete, false);
  assert.equal(result.unmatchedCount, 1);
});

test("UFE ignores single-date narrative rows without monetary evidence", () => {
  const pages = [{
    pageNumber: 1,
    rows: [{
      y: 100,
      items: [
        { text: "01-Jan-2026" },
        { text: "Statement generated for customer" },
      ],
    }],
  }];

  const result = assessExtractionCompleteness(pages, []);

  assert.equal(result.complete, true);
  assert.equal(result.unmatchedCount, 0);
});
