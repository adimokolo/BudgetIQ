import logoMark from "../assets/logo-mark.png";

export default function AuthLogo() {
  return (
    <div className="auth-logo">
      <img src={logoMark} alt="BudgetIQ" className="auth-logo-mark" />
      <span className="auth-logo-word">BUDGETIQ</span>
      <span className="auth-logo-tagline">
        Spend with insight, not guesswork.
      </span>
    </div>
  );
}
