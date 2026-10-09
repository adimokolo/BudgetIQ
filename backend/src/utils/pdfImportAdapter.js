"use strict";

const { layout, interpreters, validation } = require("./ufe");

const { extractPdfLayout } = layout;
const {
  extractPdfRowCandidates,
  extractUfeRowCandidates,
  extractGtbankPdf,
} = interpreters;
const {
  cleanPdfRowCandidates,
  inspectRepeatedPageSequences,
  validatePdfLedger,
  extractPdfStatementSummary,
  validatePdfStatementSummary,
  validatePdfTransactionDate,
  assessImportSafety,
} = validation;

function isGtbankStatement(pages) {
  const firstPageText = (pages[0]?.rows || [])
    .flatMap(row => row.items.map(item => item.text))
    .join(" ")
    .toLowerCase();

  return /guaranty\s*trust\s*bank|gtbank|gtco/.test(firstPageText) &&
    /originating\s*branch/.test(firstPageText);
}

function toAmount(value) {
  if (value == null || String(value).trim() === "") return 0;

  const cleaned = String(value).replace(/[₦,\s]/g, "");

  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function convertDate(value) {
  const text = String(value || "").trim();

  const named = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(text);
  if (named) {
    if (!validatePdfTransactionDate(text, "DD-MMM-YYYY")) return null;

    const months = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec",
    ];

    const month = months.indexOf(named[2].toLowerCase()) + 1;
    if (!month) return null;

    return `${named[3]}-${String(month).padStart(2, "0")}-${named[1]}`;
  }

  const numeric = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (numeric) {
    if (!validatePdfTransactionDate(text, "DD/MM/YYYY")) return null;

    return `${numeric[3]}-${numeric[2]}-${numeric[1]}`;
  }

  return null;
}

function convertCandidate(candidate) {
  const date = convertDate(candidate.date);
  const debit = toAmount(candidate.debit);
  const credit = toAmount(candidate.credit);

  if (!date || debit === null || credit === null) return null;
  if ((debit > 0) === (credit > 0)) return null;

  const amount = debit > 0 ? debit : credit;

  if (amount <= 0 || amount > 1000000000000) return null;

  return {
    date,
    type: debit > 0 ? "expense" : "income",
    amount,
    description: String(
      candidate.description || "Imported bank transaction"
    ).slice(0, 255),
    reference: String(candidate.reference || "").trim().slice(0, 120),
  };
}

async function prepareValidatedPdfImport(buffer) {
  const standardPages = await extractPdfLayout(buffer);
  const gtbank = isGtbankStatement(standardPages)
    ? await extractGtbankPdf(buffer)
    : null;

  const pages = gtbank ? gtbank.pages : standardPages;
  const legacyCandidates = gtbank
    ? gtbank.candidates
    : extractPdfRowCandidates(pages);

  const { assessExtractionCompleteness } = require("./ufe/validation/completeness");

  let candidates = legacyCandidates;

  if (!gtbank) {
    const enhancedCandidates = extractUfeRowCandidates(pages);
    const { selectUfeCandidates } = require("./ufe/interpreters");

    const selection = selectUfeCandidates(
      legacyCandidates,
      enhancedCandidates
    );

    if (selection.source === "ufe") {
      const completeness = assessExtractionCompleteness(
        pages,
        enhancedCandidates
      );

      if (completeness.complete) {
        const repeatedCheck = inspectRepeatedPageSequences(
          enhancedCandidates
        );

        if (repeatedCheck.valid) {
          const enhancedCleaned = cleanPdfRowCandidates(
            enhancedCandidates
          );
          const enhancedLedger = validatePdfLedger(enhancedCleaned);
          const enhancedSummary = extractPdfStatementSummary(pages);
          const enhancedReconciliation = enhancedSummary.valid
            ? validatePdfStatementSummary(
                enhancedLedger,
                enhancedSummary.summary
              )
            : { valid: false };

          const enhancedDatesValid = enhancedCleaned
            .map(convertCandidate)
            .every(Boolean);

          const enhancedSafety = assessImportSafety({
            ledgerValid: enhancedLedger.valid,
            summaryValid: enhancedReconciliation.valid,
            datesValid: enhancedDatesValid,
            repeatedPagesValid: repeatedCheck.valid,
            transactionCount: enhancedCleaned.length,
          });

          if (enhancedSafety.approved) {
            candidates = enhancedCandidates;
          }
        }
      }
    }

    if (legacyCandidates.length === 0 && candidates.length === 0) {
      return {
        approved: false,
        reason: "No validated PDF transactions extracted",
      };
    }
  }

  if (gtbank && gtbank.incompleteRowCount !== 0) {
    return {
      approved: false,
      reason: "Incomplete GTBank transaction extraction",
    };
  }

  const repeated = inspectRepeatedPageSequences(candidates);

  // Never silently discard repeated transaction pages.
  if (!repeated.valid) {
    return {
      approved: false,
      reason: "Unverified repeated transaction page sequence",
    };
  }

  const cleaned = cleanPdfRowCandidates(candidates);
  const ledger = validatePdfLedger(cleaned);
  const summary = extractPdfStatementSummary(pages);
  const reconciliation = summary.valid
    ? validatePdfStatementSummary(ledger, summary.summary)
    : { valid: false, reason: "Ambiguous statement summary" };

  const rows = cleaned.map(convertCandidate);
  const datesValid = rows.every(Boolean);

  const safety = assessImportSafety({
    ledgerValid: ledger.valid,
    summaryValid: reconciliation.valid,
    datesValid,
    repeatedPagesValid: repeated.valid,
    transactionCount: cleaned.length,
  });

  if (!safety.approved) return safety;

  return {
    approved: true,
    rows,
  };
}

module.exports = { prepareValidatedPdfImport };
