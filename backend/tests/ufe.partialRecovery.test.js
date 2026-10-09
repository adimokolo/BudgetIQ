"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  selectUfeCandidates,
} = require("../src/utils/ufe/interpreters");
const {
  validatePdfLedger,
} = require("../src/utils/ufe/validation");

test("UFE selects a complete reconciled set over partial legacy extraction", () => {
  const first = {
    date: "01-Jan-2026",
    description: "Synthetic purchase",
    debit: "100.00",
    credit: null,
    balance: "900.00",
  };

  const second = {
    date: "02-Jan-2026",
    description: "Synthetic transfer",
    debit: "50.00",
    credit: null,
    balance: "850.00",
  };

  const legacy = [first];
  const enhanced = [first, second];

  const selection = selectUfeCandidates(legacy, enhanced);

  assert.equal(selection.source, "ufe");
  assert.equal(selection.candidates.length, 2);
  assert.deepEqual(selection.candidates, enhanced);
  assert.equal(validatePdfLedger(selection.candidates).valid, true);
});

test("UFE does not replace legacy extraction with fewer candidates", () => {
  const legacy = [{ date: "01-Jan-2026" }, { date: "02-Jan-2026" }];
  const enhanced = [{ date: "01-Jan-2026" }];

  const selection = selectUfeCandidates(legacy, enhanced);

  assert.equal(selection.source, "legacy");
  assert.equal(selection.candidates, legacy);
});
