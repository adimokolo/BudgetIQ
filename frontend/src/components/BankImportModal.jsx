import { useMemo, useState } from "react";
import { NIGERIAN_BANKS } from "../utils/nigerianBanks";
import {
  previewStatement,
  previewEmailAlerts,
  updateEmailTypes,
  confirmImport,
} from "../services/bankImport";



export default function BankImportModal({
  mode,
  accounts = [],
  onClose,
  onImported,
}) {
  const [bankName, setBankName] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [emailText, setEmailText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [typeSelections, setTypeSelections] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isStatement = mode === "statement";

  const filteredBanks = useMemo(() => {
    const banks = NIGERIAN_BANKS.map((bank) => bank.name);
    const search = bankSearch.trim().toLowerCase();

    if (!search) return banks;

    return banks.filter((bank) =>
      bank.toLowerCase().includes(search),
    );
  }, [bankSearch]);

  const resetPreview = () => {
    setPreview(null);
    setTypeSelections({});
    setMessage("");
  };

  const handlePreview = async () => {
    setError("");
    setMessage("");

    if (!bankName) {
      setError("Select the Nigerian bank that issued the statement or alert.");
      return;
    }

    if (isStatement && !accountId) {
      setError("Choose the BudgetIQ account that should receive this statement.");
      return;
    }

    if (isStatement && !file) {
      setError("Select a PDF, CSV, XLS or XLSX bank statement.");
      return;
    }

    if (!isStatement && !emailText.trim()) {
      setError("Paste one or more bank transaction alert messages.");
      return;
    }

    try {
      setBusy(true);

      const result = isStatement
        ? await previewStatement(accountId, file, bankName)
        : await previewEmailAlerts(emailText, bankName);

      setPreview(result);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.error ||
        err.message ||
        "Unable to preview this import.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?.importId) return;

    try {
      setBusy(true);
      setError("");

      const unresolved = (preview.transactions || [])
        .map((item, index) => ({
          item,
          index,
          type: typeSelections[index],
        }))
        .filter(({ item }) => !isStatement && item.needsReview);

      if (unresolved.some(({ type }) => !type)) {
        setError(
          "Select Debit (Expense) or Credit (Income) for every transaction that needs review.",
        );
        return;
      }

      if (unresolved.length) {
        const updatedPreview = await updateEmailTypes(
          preview.importId,
          unresolved.map(({ index, type }) => ({
            index,
            type,
          })),
        );

        setPreview((current) => ({
          ...current,
          ...updatedPreview,
        }));
      }

      const result = await confirmImport(preview.importId);

      setMessage(
        `${result.imported || 0} transaction(s) imported. ${result.skipped || 0
        } skipped.`,
      );

      if (onImported) {
        await onImported(result);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.error ||
        err.message ||
        "Unable to import transactions.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{
          maxWidth: 620,
          width: "calc(100% - 32px)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0 }}>
              {isStatement ? "Import Bank Statement" : "Email Alert Import"}
            </h2>

            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: 13,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {isStatement
                ? "Choose the issuing bank and an existing BudgetIQ account, then upload your statement."
                : "Choose the issuing bank and paste transaction alerts you explicitly provide."}
            </p>
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: 12,
            lineHeight: 1.5,
            marginTop: 12,
          }}
        >
          Review all detected entries before confirming. Never enter your email
          password or bank password.
        </p>

        <div style={{ marginTop: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 6,
              color: "var(--ink-soft)",
            }}
          >
            1. Select Nigerian bank
          </label>

          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              type="text"
              value={bankSearch}
              onChange={(event) => {
                setBankSearch(event.target.value);
                resetPreview();
              }}
              placeholder="Search Nigerian banks..."
              autoComplete="off"
              style={{
                width: "100%",
                marginBottom: 8,
              }}
            />

            <select
              value={bankName}
              onChange={(event) => {
                setBankName(event.target.value);
                resetPreview();
              }}
              style={{
                width: "100%",
                marginBottom: 18,
              }}
            >
              <option value="">
                {bankSearch.trim() ? "Select matching bank" : "Choose your bank"}
              </option>

              {filteredBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>

            {bankName && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--ink-soft)",
                }}
              >
                Selected bank: <strong>{bankName}</strong>
              </div>
            )}
          </div>

          {isStatement ? (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 6,
                  color: "var(--ink-soft)",
                }}
              >
                2. Choose from accounts on your Account page
              </label>

              {accounts.length === 0 ? (
                <p
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  No accounts added yet. Create a New Account first, then return
                  here.
                </p>
              ) : (
                <select
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    resetPreview();
                  }}
                  style={{
                    width: "100%",
                    marginBottom: 18,
                  }}
                >
                  <option value="">Choose account</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
                </select>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 6,
                  color: "var(--ink-soft)",
                }}
              >
                3. Select bank statement
              </label>

              <input
                type="file"
                accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={busy}
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  resetPreview();
                }}
                style={{
                  width: "100%",
                  marginBottom: 18,
                }}
              />

              {file && (
                <p
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 12,
                    marginTop: -10,
                    marginBottom: 16,
                  }}
                >
                  Selected: {file.name}
                </p>
              )}
            </>
          ) : (
            <>
              <p
                style={{
                  color: "var(--ink-soft)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                A matching {bankName || "bank"} account will be used or created
                automatically when you confirm. Automatic inbox access is not
                enabled.
              </p>

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 6,
                  color: "var(--ink-soft)",
                }}
              >
                2. Paste bank transaction alerts
              </label>

              <textarea
                value={emailText}
                onChange={(event) => {
                  setEmailText(event.target.value);
                  resetPreview();
                }}
                placeholder="Paste one or more bank transaction alert messages here..."
                rows={7}
                style={{
                  width: "100%",
                  resize: "vertical",
                  marginBottom: 18,
                }}
              />
            </>
          )}

          {!preview && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy}
              onClick={handlePreview}
            >
              {busy
                ? "Preparing preview..."
                : isStatement
                  ? "Preview statement"
                  : "Preview alerts"}
            </button>
          )}

          {error && (
            <p className="error-text" style={{ marginTop: 14 }}>
              {error}
            </p>
          )}

          {preview && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>
                Review import:{" "}
                {preview.count || preview.transactions?.length || 0} transaction(s)
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                {(preview.transactions || []).slice(0, 30).map((item, index) => (
                  <div
                    key={`${item.occurred_on || item.date}-${index}`}
                    className="facet-card"
                    style={{ padding: 12 }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {item.type
                        ? `${item.type === "expense" ? "Debit (Expense)" : "Credit (Income)"} · `
                        : ""}
                      {item.amount} · {item.occurred_on || item.date}
                    </strong>

                    {!isStatement && item.needsReview && (
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 7,
                            color: "var(--ink)",
                          }}
                        >
                          Transaction type
                        </label>

                        <select
                          className="bank-import-type-select"
                          value={typeSelections[index] || ""}
                          onChange={(event) =>
                            setTypeSelections((current) => ({
                              ...current,
                              [index]: event.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            fontSize: 15,
                            fontWeight: 600,
                            padding: "10px 12px",
                            borderRadius: 8,
                          }}
                        >
                          <option value="">Select transaction type</option>
                          <option value="expense">Debit (Expense)</option>
                          <option value="income">Credit (Income)</option>
                        </select>
                      </div>
                    )}

                    <div
                      style={{
                        color: "var(--ink-soft)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>

              {!!preview.warnings?.length && (
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 12,
                    whiteSpace: "pre-line",
                    marginTop: 12,
                  }}
                >
                  {preview.warnings.join("\n")}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy}
                  onClick={() => setPreview(null)}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={
                    busy ||
                    !preview.transactions?.length ||
                    (!isStatement &&
                      preview.transactions.some(
                        (item, index) =>
                          item.needsReview && !typeSelections[index],
                      ))
                  }
                  onClick={handleConfirm}
                >
                  {busy ? "Importing..." : "Confirm import"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.4,
                color: "var(--ink)",
                background: "var(--surface-strong)",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
              }}
            >
              Import complete: {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
