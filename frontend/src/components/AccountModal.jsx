import { useMemo, useState } from "react";
import { createAccount, updateAccount } from "../services/accounts";
import { ALL_CURRENCIES } from "../utils/currency";
import { NIGERIAN_BANKS } from "../utils/nigerianBanks";

const ACCOUNT_COLORS = [
  "#6366F1",
  "#2563EB",
  "#06B6D4",
  "#10B981",
  "#22C55E",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#64748B",
];

export default function AccountModal({ account, onClose }) {
  const isEditing = !!account;

  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [form, setForm] = useState({
    name: account?.name || "",
    bankName: account?.bank_name || "",
    currency: account?.currency || "NGN",
    initialAmount: account?.initialAmount || "",
    notes: account?.notes || "",
    color: account?.color || "#6366F1",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();

    if (!query) {
      return NIGERIAN_BANKS;
    }

    return NIGERIAN_BANKS.filter(
      (bank) =>
        bank.name.toLowerCase().includes(query) ||
        bank.category.toLowerCase().includes(query)
    );
  }, [bankSearch]);

  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();

    if (!query) {
      return ALL_CURRENCIES;
    }

    return ALL_CURRENCIES.filter(
      (currency) =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
    );
  }, [currencySearch]);

  const selectedCurrency = useMemo(
    () =>
      ALL_CURRENCIES.find(
        (currency) => currency.code === form.currency
      ),
    [form.currency]
  );

  const selectedBank = useMemo(
    () => NIGERIAN_BANKS.find((bank) => bank.name === form.bankName),
    [form.bankName]
  );

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBankSelect = (bankName) => {
    setForm((prev) => ({
      ...prev,
      bankName,
    }));

    setBankSearch("");
    setShowBankPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing) {
        await updateAccount(account.id, form);
      } else {
        await createAccount(form);
      }

      onClose();
    } catch (err) {
      setError(err.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{isEditing ? "Edit Account" : "Add Account"}</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Account Name</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Main Wallet"
              required
            />
          </div>

          <div className="field">
            <label>Bank / Financial Institution</label>

            <div className="account-bank-control">
              <button
                type="button"
                className="account-bank-select"
                onClick={() => {
                  setBankSearch("");
                  setShowBankPicker((open) => !open);
                }}
                aria-expanded={showBankPicker}
              >
                <span className="account-bank-select__value">
                  {selectedBank ? (
                    <>
                      <span
                        className="account-bank-dot"
                        style={{
                          backgroundColor: selectedBank.color,
                        }}
                      />

                      <span>
                        <strong>{selectedBank.name}</strong>
                        <small>{selectedBank.category}</small>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="account-bank-none">—</span>

                      <span>
                        <strong>No bank / wallet / cash</strong>
                        <small>Manual account</small>
                      </span>
                    </>
                  )}
                </span>

                <span
                  className={`account-bank-chevron${showBankPicker
                    ? " account-bank-chevron--open"
                    : ""
                    }`}
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </button>

              {showBankPicker && (
                <div className="account-bank-picker facet-card">
                  <input
                    type="search"
                    className="account-bank-search"
                    placeholder="Search Nigerian banks..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="account-bank-list">
                    <button
                      type="button"
                      className={`account-bank-option${!form.bankName
                        ? " account-bank-option--selected"
                        : ""
                        }`}
                      onClick={() => handleBankSelect("")}
                    >
                      <span className="account-bank-none">—</span>

                      <span>
                        <strong>No bank / wallet / cash</strong>
                        <small>Manual account</small>
                      </span>
                    </button>

                    {filteredBanks.map((bank) => {
                      const isSelected =
                        form.bankName === bank.name;

                      return (
                        <button
                          key={bank.name}
                          type="button"
                          className={`account-bank-option${isSelected
                            ? " account-bank-option--selected"
                            : ""
                            }`}
                          onClick={() =>
                            handleBankSelect(bank.name)
                          }
                        >
                          <span
                            className="account-bank-dot"
                            style={{
                              backgroundColor: bank.color,
                            }}
                          />

                          <span>
                            <strong>{bank.name}</strong>
                            <small>{bank.category}</small>
                          </span>
                        </button>
                      );
                    })}

                    {filteredBanks.length === 0 && (
                      <div className="account-bank-empty">
                        No matching institution found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <label>Currency</label>

            <div className="account-currency-control">
              <button
                type="button"
                className="account-currency-select"
                onClick={() => {
                  setCurrencySearch("");
                  setShowCurrencyPicker((open) => !open);
                  setShowBankPicker(false);
                }}
                aria-expanded={showCurrencyPicker}
              >
                <span>
                  <strong>{selectedCurrency?.code || form.currency}</strong>
                  {" — "}
                  {selectedCurrency?.name || form.currency}
                </span>

                <span
                  className={`account-bank-chevron${showCurrencyPicker
                      ? " account-bank-chevron--open"
                      : ""
                    }`}
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </button>

              {showCurrencyPicker && (
                <div className="account-currency-picker">
                  <input
                    type="search"
                    className="account-currency-search"
                    placeholder="Search currencies..."
                    value={currencySearch}
                    onChange={(e) =>
                      setCurrencySearch(e.target.value)
                    }
                    autoFocus
                  />

                  <div className="account-currency-list">
                    {filteredCurrencies.map((currency) => {
                      const isSelected =
                        form.currency === currency.code;

                      return (
                        <button
                          key={currency.code}
                          type="button"
                          className={`account-currency-option${isSelected
                              ? " account-currency-option--selected"
                              : ""
                            }`}
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              currency: currency.code,
                            }));

                            setCurrencySearch("");
                            setShowCurrencyPicker(false);
                          }}
                        >
                          <strong>{currency.code}</strong>

                          <span>{currency.name}</span>
                        </button>
                      );
                    })}

                    {filteredCurrencies.length === 0 && (
                      <div className="account-bank-empty">
                        No matching currency found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <label>Account Color</label>

            <div className="account-color-info">
              <span
                className="account-color-preview"
                style={{
                  backgroundColor: form.color,
                }}
              />

              <span>
                Choose a color to help identify this account.
              </span>
            </div>

            <div className="account-color-picker">
              {ACCOUNT_COLORS.map((color) => {
                const isSelected = form.color === color;

                return (
                  <button
                    key={color}
                    type="button"
                    className={`account-color-swatch${isSelected
                      ? " account-color-swatch--selected"
                      : ""
                      }`}
                    style={{
                      backgroundColor: color,
                    }}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        color,
                      }))
                    }
                    aria-label={`Select ${color}`}
                    aria-pressed={isSelected}
                  />
                );
              })}
            </div>
          </div>

          <div className="field">
            <label>Opening Balance</label>

            <input
              name="initialAmount"
              type="number"
              value={form.initialAmount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="field">
            <label>Notes (optional)</label>

            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any extra details"
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}