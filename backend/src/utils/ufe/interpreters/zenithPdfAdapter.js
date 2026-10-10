"use strict";

const {
  detectPdfColumns,
  validatePdfLedger,
  validatePdfStatementSummary,
  validatePdfTransactionDate,
  inspectRepeatedPageSequences,
} = require("../../pdfLayout");

const NAMES = ["date", "description", "debit", "credit", "valueDate", "balance"];
const DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const MONEY = /^(?:NGN\s*|₦\s*)?-?\d[\d,]*\.\d{2}$/i;

function isZenithStatement(pages) {
  const heading = (pages?.[0]?.rows || []).slice(0, 35)
    .flatMap(r => (r.items || []).map(i => String(i.text || ""))).join(" ");
  return /zenith\s*bank/i.test(heading) && /value\s*date/i.test(heading)
    && /balance/i.test(heading);
}

function getHeader(row) {
  const found = detectPdfColumns(row);
  if (!NAMES.every(n => found.some(c => c.column === n))) return false;
  const ordered = NAMES.map(n => found.find(c => c.column === n));
  return ordered.every((c, i) => Number.isFinite(c.x) &&
    (i === 0 || c.x > ordered[i - 1].x));
}

function cents(text) {
  if (typeof text !== "string" || !MONEY.test(text)) return null;
  const cleaned = text.replace(/^(?:NGN|₦)\s*/i, "").replace(/,/g, "");
  const m = /^(-?)(\d+)\.(\d{2})$/.exec(cleaned);
  if (!m) return null;
  const n = Number(m[2]) * 100 + Number(m[3]);
  return Number.isSafeInteger(n) ? (m[1] ? -n : n) : null;
}

function layoutSupported(row) {
  const c = detectPdfColumns(row);
  const expected = [52, 111, 265, 339, 413, 473];
  return NAMES.every((n, i) => {
    const col = c.find(v => v.column === n);
    return col && Number.isFinite(col.x) &&
      Math.abs(col.x - expected[i]) <= 12;
  });
}

function fieldsFor(row) {
  const out = Object.fromEntries(NAMES.map(n => [n, []]));
  const cuts = [95, 260, 335, 410, 470];

  for (const item of row.items || []) {
    const x = Number(item.x);
    if (!Number.isFinite(x)) return null;

    const t = String(item.text || "").trim();
    if (!t) continue;

    const index = cuts.findIndex(cut => x < cut);
    out[NAMES[index === -1 ? 5 : index]].push(t);
  }
  return out;
}

function single(values, regex, allowEmpty = false) {
  if (!values.length) return allowEmpty ? "" : null;
  return values.length === 1 && regex.test(values[0])
    ? values[0] : null;
}


// Independently read Zenith's printed opening balance and final totals.
// Never construct these values from the transaction ledger.
function extractZenithSummary(pages) {
  const MONEY_TEXT = /^-?\d[\d,]*\.\d{2}$/;
  const summary = {};
  let openingRows = 0;
  let finalRows = 0;
  let ordinaryTotals = null;

  function rowAmounts(row) {
    const values = { debit: [], credit: [], balance: [] };

    for (const item of row.items || []) {
      const x = Number(item.x);
      const text = String(item.text || "").trim()
        .replace(/^(?:NGN|₦)\s*/i, "");

      if (!Number.isFinite(x) || !MONEY_TEXT.test(text)) continue;

      const cents = Math.round(Number(text.replace(/,/g, "")) * 100);
      if (!Number.isSafeInteger(cents)) return null;

      if (x >= 260 && x < 335) values.debit.push(cents);
      else if (x >= 335 && x < 410) values.credit.push(cents);
      else if (x >= 470) values.balance.push(cents);
    }

    return values;
  }

  function exactlyOne(values, key) {
    return values && values[key].length === 1
      ? values[key][0] : null;
  }

  for (const page of pages) {
    for (const row of page.rows || []) {
      const text = (row.items || [])
        .map(item => String(item.text || ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const amounts = rowAmounts(row);

      if (/\bOpening\s+Balance\b/i.test(text)) {
        openingRows++;

        const opening = exactlyOne(amounts, "balance");
        if (
          opening === null ||
          amounts.debit.length !== 1 ||
          amounts.credit.length !== 1 ||
          amounts.debit[0] !== 0 ||
          amounts.credit[0] !== 0
        ) return { valid: false };

        summary.openingBalanceCents = opening;
      }

      if (/^TOTAL\s*\(\s*CLEARED\s*\+\s*UNCLEARED\s*\)/i.test(text)) {
        finalRows++;

        const debit = exactlyOne(amounts, "debit");
        const credit = exactlyOne(amounts, "credit");
        const closing = exactlyOne(amounts, "balance");

        if (
          debit === null ||
          credit === null ||
          closing === null ||
          debit > 0 ||
          credit < 0
        ) return { valid: false };

        summary.debitTotalCents = -debit;
        summary.creditTotalCents = credit;
        summary.closingBalanceCents = closing;
      } else if (/^TOTALS\b/i.test(text)) {
        const debit = exactlyOne(amounts, "debit");
        const credit = exactlyOne(amounts, "credit");

        if (ordinaryTotals !== null ||
            debit === null || credit === null ||
            debit > 0 || credit < 0) {
          return { valid: false };
        }

        ordinaryTotals = {
          debitTotalCents: -debit,
          creditTotalCents: credit
        };
      }
    }
  }

  if (openingRows !== 1 || finalRows !== 1 || !ordinaryTotals) {
    return { valid: false };
  }

  if (
    ordinaryTotals.debitTotalCents !== summary.debitTotalCents ||
    ordinaryTotals.creditTotalCents !== summary.creditTotalCents
  ) return { valid: false };

  // This Zenith layout includes the opening balance in its printed
  // credit total. Exclude it only after checking the printed figures.
  const adjustedCredits =
    summary.creditTotalCents - summary.openingBalanceCents;

  if (
    !Number.isSafeInteger(adjustedCredits) ||
    adjustedCredits < 0 ||
    summary.openingBalanceCents +
      adjustedCredits -
      summary.debitTotalCents !== summary.closingBalanceCents
  ) {
    return { valid: false };
  }

  summary.creditTotalCents = adjustedCredits;

  return { valid: true, summary };
}

function extractZenithCandidates(pages) {
  if (!isZenithStatement(pages)) return null;

  let started = false;
  let ended = false;
  let opening = null;
  let active = null;
  let bad = false;
  let totalsFound = false;

  const candidates = [];

  function finish() {
    if (!active) return;

    const r = active;
    active = null;

    const debit = cents(r.debit || "0.00");
    const credit = cents(r.credit || "0.00");

    if (
      !validatePdfTransactionDate(r.date, "DD/MM/YYYY") ||
      !validatePdfTransactionDate(r.valueDate, "DD/MM/YYYY") ||
      !r.description ||
      cents(r.balance) === null ||
      debit === null ||
      credit === null ||
      debit < 0 ||
      credit < 0 ||
      (debit > 0) === (credit > 0)
    ) {
      bad = true;
      return;
    }

    r.debit = debit > 0 ? r.debit : "";
    r.credit = credit > 0 ? r.credit : "";

    candidates.push(r);
  }

  for (const [pageIndex, page] of pages.entries()) {
    for (const row of page.rows || []) {
      const text = (row.items || [])
        .map(i => String(i.text || "")).join(" ");

      if (getHeader(row)) {
        if (started || ended || !layoutSupported(row)) return null;
        started = true;
        continue;
      }

      if (!started || ended) continue;

      if (/\bTOTALS?\b|TOTAL\s*\(\s*CLEARED/i.test(text)) {
        finish();
        totalsFound = true;
        ended = true;
        continue;
      }

      const f = fieldsFor(row);
      if (!f) return null;

      const date = single(f.date, DATE, true);
      const valueDate = single(f.valueDate, DATE, true);
      const debit = single(f.debit, MONEY, true);
      const credit = single(f.credit, MONEY, true);
      const balance = single(f.balance, MONEY, true);
      const description = f.description.join(" ").trim();

      if ([date, valueDate, debit, credit, balance]
          .some(v => v === null)) {
        // Ignore non-financial introductory text before the
        // opening balance. Never ignore malformed transaction rows.
        const introductoryText =
          opening === null &&
          active === null &&
          candidates.length === 0 &&
          !f.date.length &&
          !f.valueDate.length &&
          !f.credit.length &&
          !f.balance.length &&
          f.debit.length > 0 &&
          debit === null;

        if (introductoryText) continue;

        // A wrapped narration can extend into the debit-column
        // region. Accept only a single non-monetary text fragment
        // with letters, no decimal punctuation and no financial cells.
        const narrationFragment =
          active !== null &&
          !f.date.length &&
          !f.valueDate.length &&
          !f.description.length &&
          f.debit.length === 1 &&
          !f.credit.length &&
          !f.balance.length &&
          debit === null &&
          /\p{L}/u.test(f.debit[0]) &&
          !/[.,₦$]/.test(f.debit[0]);

        if (narrationFragment) {
          active.description =
            `${active.description} ${f.debit[0]}`.trim().slice(0, 2000);
          continue;
        }

        bad = true;
        continue;
      }

      if (date) {
        finish();

        if (!valueDate || !balance || !description) bad = true;

        active = {
          page: page.pageNumber ?? pageIndex + 1,
          y: row.y,
          date,
          valueDate,
          reference: "",
          description,
          debit,
          credit,
          balance,
        };
        continue;
      }

      if (
        !active &&
        candidates.length === 0 &&
        opening === null &&
        !valueDate &&
        balance &&
        cents(debit || "0.00") === 0 &&
        cents(credit || "0.00") === 0
      ) {
        opening = cents(balance);
        if (opening === null) bad = true;
        continue;
      }

      if (
        !f.date.length &&
        !f.valueDate.length &&
        !f.debit.length &&
        !f.credit.length &&
        !f.balance.length
      ) {
        if (active && description) {
          active.description =
            `${active.description} ${description}`.slice(0, 2000);
        }
        // Text-only headings before the first transaction are not
        // financial rows and must not invalidate the statement.
        continue;
      }

      bad = true;
    }
  }

  finish();

  if (
    bad ||
    opening === null ||
    !totalsFound ||
    candidates.length === 0
  ) return null;

  if (!inspectRepeatedPageSequences(candidates).valid) return null;

  const ledger = validatePdfLedger(candidates);
  if (!ledger.valid) return null;

  const summary = extractZenithSummary(pages);
  if (!summary.valid ||
      !validatePdfStatementSummary(ledger, summary.summary).valid) {
    return null;
  }

  return candidates;
}

module.exports = { isZenithStatement, extractZenithCandidates, extractZenithSummary };
