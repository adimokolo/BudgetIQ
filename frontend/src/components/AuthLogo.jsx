import logoMark from '../assets/logo-mark.png';

/**
 * Used on every pre-login page (Login, Register, Verify OTP, Forgot/Reset
 * Password). The icon stays an image, but the wordmark and tagline are real
 * text - so font-size, weight, or color changes here apply everywhere at
 * once, instead of needing a new flattened image each time.
 */
export default function AuthLogo() {
  return (
    <div className="auth-logo">
      <img src={logoMark} alt="BudgetIQ" className="auth-logo-mark" />
      <span className="auth-logo-word">BUDGETIQ</span>
      <span className="auth-logo-tagline">Spend with insight, not guesswork.</span>
    </div>
  );
}
