import { PasswordInput } from "../components/PasswordInput";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLogo from "../components/AuthLogo";
import TermsModal from "../components/TermsModal";
import { ALL_CURRENCIES } from "../utils/currency";

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [currencySearch, setCurrencySearch] = useState("");
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [agreementError, setAgreementError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setAgreementError(
        "Please agree to the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }
    setAgreementError(null);
    const ok = await register(fullName, email, password, currency);
    if (ok) navigate("/verify-otp", { state: { email } });
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <AuthLogo />
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">
          Clarity for your income and spending starts here.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adim Barnabas Okolo"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>
          <div className="field">
            <label>Currency</label>

            <button
              type="button"
              className="currency-register-trigger"
              onClick={() => {
                setCurrencyPickerOpen((open) => !open);
                setCurrencySearch("");
              }}
            >
              <span>
                {(() => {
                  const selected = ALL_CURRENCIES.find(
                    (c) => c.code === currency,
                  );
                  return selected
                    ? `${selected.code} — ${selected.name}`
                    : currency;
                })()}
              </span>

              <span aria-hidden="true">{currencyPickerOpen ? "▲" : "▼"}</span>
            </button>

            {currencyPickerOpen && (
              <div className="currency-register-dropdown">
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  autoFocus
                />

                <div className="currency-picker-list">
                  {ALL_CURRENCIES.filter((c) => {
                    const query = currencySearch.trim().toLowerCase();

                    if (!query) return true;

                    return (
                      c.code.toLowerCase().includes(query) ||
                      c.name.toLowerCase().includes(query)
                    );
                  }).map((c) => {
                    const isSelected = c.code === currency;

                    return (
                      <button
                        key={c.code}
                        type="button"
                        className={`currency-picker-row${
                          isSelected ? " currency-picker-row--selected" : ""
                        }`}
                        onClick={() => {
                          setCurrency(c.code);
                          setCurrencySearch("");
                          setCurrencyPickerOpen(false);
                        }}
                      >
                        <span>
                          {c.code} — {c.name}
                        </span>
                        {isSelected && <span aria-hidden="true">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (e.target.checked) setAgreementError(null);
              }}
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setTermsOpen(true)}
              >
                Terms of Service and Privacy Policy
              </button>
            </span>
          </label>
          {agreementError && (
            <p className="error-text" style={{ marginBottom: 14 }}>
              {agreementError}
            </p>
          )}

          {error && (
            <p className="error-text" style={{ marginBottom: 14 }}>
              {error}
            </p>
          )}

          <button
            className="btn btn--primary btn--block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p
          className="helper-text"
          style={{ marginTop: 18, textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--brand-mid)", fontWeight: 600 }}
          >
            Log in
          </Link>
        </p>
      </div>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </div>
  );
}
