import AppFooter from "./AppFooter";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-page-content">{children}</div>
      <AppFooter />
    </div>
  );
}
