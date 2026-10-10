"use strict";

/**
 * Select an extraction candidate set without merging transactions.
 * This is preliminary selection only; financial validation remains mandatory.
 */
function selectUfeCandidates(legacyCandidates, enhancedCandidates) {
  if (!Array.isArray(legacyCandidates) || !Array.isArray(enhancedCandidates)) {
    throw new TypeError("Candidate sets must be arrays");
  }

  if (enhancedCandidates.length > legacyCandidates.length) {
    return {
      source: "ufe",
      candidates: enhancedCandidates,
    };
  }

  return {
    source: "legacy",
    candidates: legacyCandidates,
  };
}

module.exports = { selectUfeCandidates };
