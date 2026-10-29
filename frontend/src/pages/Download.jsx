import { useTheme } from "../context/ThemeContext";
import { FaApple, FaGlobe, FaGooglePlay } from "react-icons/fa6";
import logoMark from "../assets/logo-mark.png";
import PublicSocialLinks from "../components/PublicSocialLinks";
import "../styles/home.css";
import "../styles/download.css";

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.getbudgetiq.app";

export default function Download() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="public-home download-page">
      <header className="public-header download-header">
        <a className="public-brand" href="/home" aria-label="KashMetrix home">
          <img src={logoMark} alt="" />
          <span>KashMetrix</span>
        </a>

        <div className="download-header-actions">
          <PublicSocialLinks />

          <button
            type="button"
            className="public-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      <main className="download-main">
        <section className="download-intro">
          <span className="public-eyebrow">YOUR MONEY, MORE CLARITY</span>
          <h1>Track smarter. Understand more.</h1>
          <p className="download-intro-support">
            Choose how you want to experience KashMetrix.
          </p>
        </section>

        <section className="download-options" aria-label="Get KashMetrix">
          <a
            className="download-option"
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="download-option-icon" aria-hidden="true">
              <FaGooglePlay />
            </span>
            <span className="download-option-copy">
              <small>DOWNLOAD FOR ANDROID</small>
              <strong>Google Play</strong>
            </span>
            <span className="download-option-arrow" aria-hidden="true">
              ↗
            </span>
          </a>

          <div
            className="download-option download-option-disabled"
            aria-label="Apple App Store, coming soon"
          >
            <span className="download-option-icon" aria-hidden="true">
              <FaApple />
            </span>
            <span className="download-option-copy">
              <small>FOR IPHONE AND IPAD</small>
              <strong>Apple App Store</strong>
              <span className="download-coming-soon">Coming soon</span>
            </span>
          </div>

          <a className="download-option" href="/home">
            <span className="download-option-icon" aria-hidden="true">
              <FaGlobe />
            </span>
            <span className="download-option-copy">
              <small>NO DOWNLOAD REQUIRED</small>
              <strong>Use KashMetrix on the Web</strong>
            </span>
            <span className="download-option-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </section>
      </main>

      <footer className="public-footer download-footer">
        <span>
          KashMetrix © 2026 <strong>B&amp;P DevRights</strong>. All rights
          reserved.
        </span>
        <PublicSocialLinks footer />
        <span>Track smarter. Understand more.</span>
      </footer>
    </div>
  );
}
