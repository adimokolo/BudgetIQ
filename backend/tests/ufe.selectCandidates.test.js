"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  selectUfeCandidates,
} = require("../src/utils/ufe/interpreters/selectCandidates");

test("prefers enhanced extraction when it contains more candidates", () => {
  const legacy = [{ id: 1 }];
  const enhanced = [{ id: 1 }, { id: 2 }];

  const result = selectUfeCandidates(legacy, enhanced);

  assert.equal(result.source, "ufe");
  assert.equal(result.candidates, enhanced);
});

test("preserves legacy extraction when candidate counts are equal", () => {
  const legacy = [{ id: 1 }];
  const enhanced = [{ id: 2 }];

  const result = selectUfeCandidates(legacy, enhanced);

  assert.equal(result.source, "legacy");
  assert.equal(result.candidates, legacy);
});

test("preserves legacy extraction when enhanced extraction has fewer candidates", () => {
  const legacy = [{ id: 1 }, { id: 2 }];
  const enhanced = [{ id: 1 }];

  const result = selectUfeCandidates(legacy, enhanced);

  assert.equal(result.source, "legacy");
  assert.equal(result.candidates, legacy);
});

test("rejects invalid candidate collections", () => {
  assert.throws(
    () => selectUfeCandidates(null, []),
    TypeError
  );
  assert.throws(
    () => selectUfeCandidates([], undefined),
    TypeError
  );
});
