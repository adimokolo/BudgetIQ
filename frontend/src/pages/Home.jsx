import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import logoMark from "../assets/logo-mark.png";
import dashboard from "../assets/homepage/01_Dashboard_Laptop_1920x1080.jpg";
import charts from "../assets/homepage/02_Transaction_Charts_Laptop_1920x1080.jpg";
import converter from "../assets/homepage/currency-converter.png";
import transactions from "../assets/homepage/03_Transactions_Laptop_1920x1080.jpg";
import categories from "../assets/homepage/04_Categories_Laptop_1920x1080.jpg";
import budgets from "../assets/homepage/05_Budgets_Laptop_1920x1080.jpg";
import "../styles/home.css";

const slides = [
  {
    title: "Understand your money at a glance",
    description:
      "Bring your income, expenses and financial insights into one clear dashboard.",
    image: dashboard,
    alt: "KashMetrix desktop and mobile dashboard",
  },
  {
    title: "Turn transactions into clear insights",
    description:
      "Explore your spending patterns through visual transaction analytics.",
    image: charts,
    alt: "KashMetrix transaction analytics on desktop and mobile",
  },
  {
    title: "Manage money across currencies",
    description:
      "Keep your financial picture organised with multi-currency tools.",
    image: converter,
    alt: "KashMetrix currency converter interface",
  },
];

const features = [
  {
    title: "Transactions",
    description: "Keep your financial activity organised.",
    image: transactions,
  },
  {
    title: "Categories",
    description: "Understand where your money goes.",
    image: categories,
  },
  {
    title: "Budgets",
    description: "Plan your spending with greater clarity.",
    image: budgets,
  },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const slide = slides[active];

  return (
    <div className="public-home">
      <header className="public-header">
        <Link className="public-brand" to="/home">
          <img src={logoMark} alt="" />
          <span>KashMetrix</span>
        </Link>

        <nav className="public-actions" aria-label="Account navigation">
          <button
            type="button"
            className="public-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          {user ? (
            <Link to="/" className="public-button">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="public-login">Log In</Link>
              <Link to="/register" className="public-button">Create Account</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="public-eyebrow">WELCOME TO KASHMETRIX</span>
            <h1>
              Track smarter.
              <span> Understand more.</span>
            </h1>
            <p>
              See your finances more clearly. Track transactions,
              understand spending patterns and make more informed
              financial decisions.
            </p>

            <div className="public-hero-actions">
              {user ? (
                <Link to="/" className="public-button">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="public-button">
                    Get Started
                  </Link>
                  <Link to="/login" className="public-secondary">
                    Already have an account? Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="public-hero-visual">
            <img
              src={dashboard}
              alt="KashMetrix dashboard displayed on desktop and mobile"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="public-showcase" aria-labelledby="showcase-title">
          <div className="public-section-heading">
            <span className="public-eyebrow">EXPLORE KASHMETRIX</span>
            <h2 id="showcase-title">Your money, made clearer.</h2>
          </div>

          <div className="public-slide">
            <div className="public-slide-image">
              <img src={slide.image} alt={slide.alt} />
            </div>

            <div className="public-slide-copy" aria-live="polite">
              <span className="public-slide-count">
                {String(active + 1).padStart(2, "0")} / 03
              </span>
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>

              <div className="public-slide-controls">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() =>
                    setActive((index) => (index + slides.length - 1) % slides.length)
                  }
                >
                  ←
                </button>

                {slides.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={index === active ? "public-dot active" : "public-dot"}
                    aria-label={`Show slide ${index + 1}`}
                    aria-current={index === active ? "true" : undefined}
                    onClick={() => setActive(index)}
                  />
                ))}

                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => setActive((index) => (index + 1) % slides.length)}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="public-features" aria-labelledby="features-title">
          <div className="public-section-heading">
            <span className="public-eyebrow">EVERYDAY MONEY CLARITY</span>
            <h2 id="features-title">More than expense tracking.</h2>
          </div>

          <div className="public-feature-grid">
            {features.map((feature) => (
              <article className="public-feature" key={feature.title}>
                <img src={feature.image} alt="" loading="lazy" />
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="public-cta">
          <h2>Ready to understand your money better?</h2>
          <p>Start building a clearer picture of your finances with KashMetrix.</p>
          <Link to={user ? "/" : "/register"} className="public-button">
            {user ? "Go to Dashboard" : "Create Your Account"}
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <span>KashMetrix © 2026 <strong>B&amp;P DevRights</strong>. All rights reserved.</span>
        <span>Track smarter. Understand more.</span>
      </footer>
    </div>
  );
}
