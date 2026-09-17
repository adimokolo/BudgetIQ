import { useState } from "react";
import Modal from "./Modal";
import CustomSelect from "./CustomSelect";
import { ALL_CURRENCIES, formatCurrency } from "../utils/currency";
import { convertCurrency } from "../services/convertCurrency";

const CURRENCY_OPTIONS = ALL_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name}`,
}));

export default function CurrencyConverterModal({
  defaultFrom = "NGN",
  defaultTo = "USD",
  onClose,
}) {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState(defaultFrom);
  const [toCurrency, setToCurrency] = useState(defaultTo);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConvert = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("Enter a valid amount to convert.");
      return;
    }
    setLoading(true);
    try {
      const converted = await convertCurrency(value, fromCurrency, toCurrency);
      setResult(converted);
    } catch (err) {
      setError(err.message || "Could not fetch exchange rates right now.");
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <Modal title="Currency Converter" onClose={onClose}>
      <form onSubmit={handleConvert}>
        <div className="field">
          <label>Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setResult(null);
            }}
            placeholder="0.00"
            autoFocus
          />
        </div>

        <div className="field">
          <label>From</label>
          <CustomSelect
            value={fromCurrency}
            onChange={(val) => {
              setFromCurrency(val);
              setResult(null);
            }}
            options={CURRENCY_OPTIONS}
            searchPlaceholder="Search currency..."
          />
        </div>

        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={swapCurrencies}
            title="Swap currencies"
            style={{ fontSize: 18, padding: "6px 20px" }}
          >
            ⇅ Swap
          </button>
        </div>

        <div className="field">
          <label>To</label>
          <CustomSelect
            value={toCurrency}
            onChange={(val) => {
              setToCurrency(val);
              setResult(null);
            }}
            options={CURRENCY_OPTIONS}
            searchPlaceholder="Search currency..."
          />
        </div>

        {error && (
          <p className="error-text" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        {result !== null && !error && (
          <div
            className="facet-card"
            style={{
              padding: "14px 16px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-faint)",
                marginBottom: 4,
              }}
            >
              {formatCurrency(Number(amount), fromCurrency)} ≈
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {formatCurrency(result, toCurrency)}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}
            >
              {fromCurrency} → {toCurrency}
            </div>
          </div>
        )}

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Converting…" : "Convert"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
