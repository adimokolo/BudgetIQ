import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link, useParams } from "react-router-dom";
import PublicSocialLinks from "../components/PublicSocialLinks";
import apiClient from "../api/client";
import logoMark from "../assets/logo-mark.png";
import "../styles/moneyInsights.css";

function parseContent(body) {
  try {
    const value = JSON.parse(body);
    if (value?.format === "kashmetrix-blocks-v1" && Array.isArray(value.blocks)) return value;
  } catch { }
  const blocks = String(body || "").split(/\n\s*\n/).filter(Boolean).map((chunk) => {
    const t = chunk.trim();
    if (t.startsWith("### ")) return { type: "subheading", text: t.slice(4) };
    if (t.startsWith("## ")) return { type: "heading", text: t.slice(3) };
    if (t.startsWith("- ")) return { type: "list", items: t.split("\n").map(line => line.replace(/^-\s*/, "")) };
    return { type: "paragraph", text: t };
  });
  return { format: "legacy", featuredImage: null, blocks };
}
function renderBlocks(blocks) {
  return blocks.map((block, i) => {
    if (block.type === "heading") return <h2 key={i}>{block.text}</h2>;
    if (block.type === "subheading") return <h3 key={i}>{block.text}</h3>;
    if (block.type === "list") return <ul key={i}>{(block.items || []).filter(Boolean).map((item, j) => <li key={j}>{item}</li>)}</ul>;
    if (block.type === "image") return block.url ? <figure className="insights-inline-image" key={i}>
      <img src={block.url} alt={block.alt || ""} loading="lazy" decoding="async" />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure> : null;
    return block.text ? <p key={i}>{block.text.split("\n").map((line, j) => <span key={j}>{j > 0 && <br />}{line}</span>)}</p> : null;
  });
}

function ArticleShare({ article }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/money-insights/${encodeURIComponent(article.slug)}`;
  const shareText = `${article.title} — KashMetrix`;

  const destinations = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this article link:", url);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: shareText, url });
      } catch (error) {
        if (error?.name !== "AbortError") copyLink();
      }
    } else {
      copyLink();
    }
  }

  return (
    <section className="insights-share" aria-label="Share this article">
      <h2>Share this article</h2>
      <p>Help others discover practical money guidance from KashMetrix.</p>
      <div className="insights-share-actions">
        {destinations.map((item) => (
          <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer">
            {item.name}
          </a>
        ))}
        <button type="button" onClick={copyLink}>{copied ? "Link copied!" : "Copy link"}</button>
        <button type="button" onClick={nativeShare}>Share…</button>
      </div>
      <span className="insights-share-status" role="status" aria-live="polite">
        {copied ? "Article link copied to clipboard." : ""}
      </span>
    </section>
  );
}

export default function MoneyInsightArticle() {
  const { theme } = useTheme();
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let live = true;
    apiClient.get(`/articles/${encodeURIComponent(slug)}`).then(({ data }) => {
      if (!live) return;
      setArticle(data.article); setState("ready");
      document.title = `${data.article.seo_title || data.article.title} | KashMetrix`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = data.article.meta_description || data.article.summary;
    }).catch(() => live && setState("missing"));
    return () => { live = false; };
  }, [slug]);
  const content = article ? parseContent(article.body) : null;
  const featured = content?.featuredImage;
  return <div className="insights-shell" data-theme={theme}>
    <header className="insights-header"><Link to="/home" className="insights-brand"><img src={logoMark} alt="" />KashMetrix</Link><nav><Link to="/money-insights">Money Insights</Link><Link to="/register" className="insights-cta">Get started</Link></nav><PublicSocialLinks /></header>
    <main className="insights-article-main"><Link className="insights-back" to="/money-insights">← All Money Insights</Link>
      {state === "loading" && <p role="status">Loading article…</p>}
      {state === "missing" && <section className="insights-empty"><h1>Article not found</h1><p>This article may have been unpublished or the address may be incorrect.</p><Link to="/money-insights">Browse Money Insights</Link></section>}
      {state === "ready" && article && <article>
        <p className="insights-eyebrow">MONEY INSIGHTS</p><h1>{article.title}</h1><p className="insights-article-summary">{article.summary}</p>
        <p className="insights-card-meta">{article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
        <section className="insights-author" aria-label="About the author">
          <div className="insights-author-copy">
            <p className="insights-author-name">By Adim Barnabas Okolo</p>
            <p className="insights-author-role">DevOps / Cloud Engineer</p>
            <p className="insights-author-bio">Apps &amp; Development Unit, ICT, LASUTH</p>
            <p className="insights-author-bio">Co-founder, B&amp;P DevRights</p>
          </div>
        </section>
        {featured?.url && <figure className="insights-featured-image"><img src={featured.url} alt={featured.alt || ""} />{featured.caption && <figcaption>{featured.caption}</figcaption>}</figure>}
        <div className="insights-article-body">{renderBlocks(content.blocks || [])}</div>
        <ArticleShare article={article} />
        <div className="insights-article-end"><p>Build a clearer picture of your money with KashMetrix.</p><Link className="insights-cta" to="/register">Get started</Link></div>
      </article>}
    </main>
    <footer className="public-footer insights-public-footer"><span>KashMetrix © 2026 <strong>B&amp;P DevRights</strong>. All rights reserved.</span><PublicSocialLinks footer /><span>Track smarter. Understand more.</span></footer>
  </div>;
}
