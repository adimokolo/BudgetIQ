import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import "../styles/moneyInsights.css";

const emptyBlock = (type = "paragraph") => {
  if (type === "heading" || type === "subheading") return { type, text: "" };
  if (type === "list") return { type, items: [""] };
  if (type === "image") return { type, url: "", alt: "", caption: "" };
  return { type: "paragraph", text: "" };
};
const blank = {
  title: "", slug: "", summary: "", blocks: [emptyBlock()],
  featuredImage: { url: "", alt: "", caption: "" },
  seo_title: "", meta_description: "", author_name: "", author_role: "", author_organization: "", author_affiliation: ""
};
const slugify = (v) => v.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "").slice(0, 180);

function readContent(body) {
  try {
    const value = JSON.parse(body);
    if (value?.format === "kashmetrix-blocks-v1" && Array.isArray(value.blocks)) {
      return {
        blocks: value.blocks.length ? value.blocks : [emptyBlock()],
        featuredImage: value.featuredImage || { url: "", alt: "", caption: "" }
      };
    }
  } catch {}
  const blocks = String(body || "").split(/\n\s*\n/).filter(Boolean).map((chunk) => {
    const t = chunk.trim();
    if (t.startsWith("### ")) return { type: "subheading", text: t.slice(4) };
    if (t.startsWith("## ")) return { type: "heading", text: t.slice(3) };
    if (t.startsWith("- ")) return { type: "list", items: t.split("\n").map(line => line.replace(/^-\s*/, "")) };
    return { type: "paragraph", text: t };
  });
  return { blocks: blocks.length ? blocks : [emptyBlock()], featuredImage: { url: "", alt: "", caption: "" } };
}
function encodeContent(form) {
  return JSON.stringify({
    format: "kashmetrix-blocks-v1",
    featuredImage: form.featuredImage,
    blocks: form.blocks
  });
}
function BlockPreview({ blocks }) {
  return <div className="admin-block-preview">{blocks.map((block, i) => {
    if (block.type === "heading") return <h2 key={i}>{block.text}</h2>;
    if (block.type === "subheading") return <h3 key={i}>{block.text}</h3>;
    if (block.type === "list") return <ul key={i}>{(block.items || []).map((item, j) => <li key={j}>{item}</li>)}</ul>;
    if (block.type === "image") return block.url ? <figure key={i}>
      <img src={block.url} alt={block.alt || ""} loading="lazy" />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure> : <p key={i} className="admin-image-placeholder">Add an image URL to preview this block.</p>;
    return <p key={i}>{block.text}</p>;
  })}</div>;
}
export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/articles/admin/list");
      setArticles(data.articles || []); setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Could not load articles. The database migration may not be applied yet.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const change = (key, value) => setForm(old => ({ ...old, [key]: value, ...(key === "title" && autoSlug ? { slug: slugify(value) } : {}) }));
  const fresh = () => { setSelected(null); setForm({ ...blank, blocks: [emptyBlock()] }); setAutoSlug(true); setPreview(false); setNotice(""); setError(""); };
  const edit = (a) => {
    const content = readContent(a.body);
    setSelected(a);
    setForm({
      title: a.title, slug: a.slug, summary: a.summary, ...content,
      seo_title: a.seo_title || "", meta_description: a.meta_description || "",
      author_name: a.author_name || "", author_role: a.author_role || "",
      author_organization: a.author_organization || "", author_affiliation: a.author_affiliation || ""
    });
    setAutoSlug(false); setPreview(false); setNotice(""); setError("");
  };
  const updateBlock = (index, key, value) => setForm(old => ({
    ...old, blocks: old.blocks.map((b, i) => i === index ? { ...b, [key]: value } : b)
  }));
  const moveBlock = (index, offset) => setForm(old => {
    const blocks = [...old.blocks], target = index + offset;
    if (target < 0 || target >= blocks.length) return old;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    return { ...old, blocks };
  });
  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = {
        title: form.title, slug: form.slug, summary: form.summary,
        body: encodeContent(form), seo_title: form.seo_title || form.title,
        meta_description: form.meta_description || form.summary,
        author_name: form.author_name, author_role: form.author_role,
        author_organization: form.author_organization, author_affiliation: form.author_affiliation
      };
      const { data } = selected
        ? await apiClient.put(`/articles/admin/${selected.id}`, payload)
        : await apiClient.post("/articles/admin", payload);
      setSelected(data.article);
      setForm(old => ({ ...old, title: data.article.title, slug: data.article.slug }));
      setNotice(selected ? "Article changes saved successfully." : "Draft saved successfully.");
      await refresh();
    } catch (e) { setError(e.response?.data?.error || "Could not save article."); }
    finally { setSaving(false); }
  };
  const status = async (value) => {
    if (!selected) { setError("Save the article as a draft before publishing."); return; }
    if (!window.confirm(value === "published" ? "Publish this article publicly? Anyone will be able to read it." : "Unpublish this article? It will no longer appear publicly.")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { data } = await apiClient.patch(`/articles/admin/${selected.id}/status`, { status: value });
      setSelected(data.article);
      setNotice(value === "published" ? "Article published." : "Article unpublished and returned to draft.");
      await refresh();
    } catch (e) { setError(e.response?.data?.error || "Could not change article status."); }
    finally { setSaving(false); }
  };
  const deleteDraft = async () => {
    if (!selected || selected.status !== "draft") return;
    if (!window.confirm(`Delete the draft "${selected.title}" permanently? This cannot be undone.`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await apiClient.delete(`/articles/admin/${selected.id}`);
      fresh();
      setNotice("Draft deleted successfully.");
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || "Could not delete draft.");
    } finally {
      setSaving(false);
    }
  };
  const updateFeatured = (key, value) => setForm(old => ({ ...old, featuredImage: { ...old.featuredImage, [key]: value } }));
  const updateListItem = (index, itemIndex, value) => setForm(old => ({
    ...old, blocks: old.blocks.map((b, i) => i === index ? { ...b, items: b.items.map((v, j) => j === itemIndex ? value : v) } : b)
  }));
  const addListItem = (index) => setForm(old => ({ ...old, blocks: old.blocks.map((b, i) => i === index ? { ...b, items: [...b.items, ""] } : b) }));
  const removeBlock = (index) => setForm(old => {
    const blocks = old.blocks.filter((_, i) => i !== index);
    return { ...old, blocks: blocks.length ? blocks : [emptyBlock()] };
  });

  return <div className="admin-articles-page">
    <div className="admin-page-heading"><div><h1>Articles</h1><p>Create and manage public Money Insights content.</p></div><button type="button" className="insights-cta" onClick={fresh}>New article</button></div>
    <p className="admin-articles-note">Drafts remain private. Publishing makes an article public; unpublishing removes it from the public feed. Images currently use public HTTPS image URLs; uploads will be enabled after persistent storage is configured.</p>
    {notice && <p className="admin-articles-notice" role="status">{notice}</p>}
    {error && <p className="admin-articles-error" role="alert">{error}</p>}
    <div className="admin-articles-layout">
      <section className="admin-articles-list"><h2>All articles</h2>
        {loading ? <p>Loading…</p> : articles.length === 0 ? <p>No articles yet.</p> : articles.map(a =>
          <button type="button" key={a.id} className={`admin-article-row${selected?.id === a.id ? " selected" : ""}`} onClick={() => edit(a)}>
            <strong>{a.title}</strong><span>{a.status} · Updated {new Date(a.updated_at).toLocaleDateString()}</span>
          </button>)}
      </section>
      <section className="admin-articles-editor">
        <div className="admin-articles-editor-head"><h2>{selected ? "Edit article" : "New draft"}</h2><span className={`admin-article-status ${selected?.status || "draft"}`}>{selected?.status || "draft"}</span></div>
        {preview ? <div className="admin-article-preview">
          <p className="insights-eyebrow">PREVIEW</p><h1>{form.title || "Untitled article"}</h1><p>{form.summary}</p>
          {(form.author_name || form.author_role || form.author_organization || form.author_affiliation) && <section className="insights-author" aria-label="About the author"><div className="insights-author-copy">
            {form.author_name && <p className="insights-author-name">By {form.author_name}</p>}
            {form.author_role && <p className="insights-author-role">{form.author_role}</p>}
            {form.author_organization && <p className="insights-author-bio">{form.author_organization}</p>}
            {form.author_affiliation && <p className="insights-author-bio">{form.author_affiliation}</p>}
          </div></section>}
          {form.featuredImage.url && <figure className="insights-featured-image"><img src={form.featuredImage.url} alt={form.featuredImage.alt || ""}/>{form.featuredImage.caption && <figcaption>{form.featuredImage.caption}</figcaption>}</figure>}
          <BlockPreview blocks={form.blocks}/>
        </div> : <div className="admin-article-form">
          <label>Title<input value={form.title} maxLength={180} onChange={e => change("title", e.target.value)}/></label>
          <label>URL slug<input value={form.slug} maxLength={180} onChange={e => { setAutoSlug(false); change("slug", slugify(e.target.value)); }}/><small>Public address: /money-insights/{form.slug || "article-slug"}</small></label>
          <label>Summary<textarea value={form.summary} maxLength={320} rows={3} onChange={e => change("summary", e.target.value)}/><small>{form.summary.length}/320 characters</small></label>
          <fieldset className="admin-image-fields"><legend>Optional featured image</legend>
            <label>Image URL<input type="url" value={form.featuredImage.url} onChange={e => updateFeatured("url", e.target.value)} placeholder="https://…"/></label>
            <label>Alternative text<input value={form.featuredImage.alt} maxLength={300} onChange={e => updateFeatured("alt", e.target.value)} placeholder="Describe the image for accessibility"/></label>
            <label>Caption<input value={form.featuredImage.caption} maxLength={300} onChange={e => updateFeatured("caption", e.target.value)} placeholder="Optional caption"/></label>
          </fieldset>
          <div className="admin-blocks-heading"><h3>Article content</h3><span>Arrange blocks in reading order.</span></div>
          {form.blocks.map((block, index) => <fieldset className="admin-content-block" key={`${index}-${block.type}`}>
            <div className="admin-content-block-head"><strong>Block {index + 1} · {block.type}</strong><div>
              <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label={`Move block ${index + 1} up`}>↑</button>
              <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === form.blocks.length - 1} aria-label={`Move block ${index + 1} down`}>↓</button>
              <button type="button" onClick={() => removeBlock(index)} aria-label={`Remove block ${index + 1}`}>Remove</button>
            </div></div>
            {block.type === "image" ? <>
              <label>Image URL<input type="url" value={block.url} onChange={e => updateBlock(index, "url", e.target.value)} placeholder="https://…"/></label>
              <label>Alternative text<input value={block.alt} maxLength={300} onChange={e => updateBlock(index, "alt", e.target.value)} placeholder="Describe the image"/></label>
              <label>Caption<input value={block.caption} maxLength={300} onChange={e => updateBlock(index, "caption", e.target.value)} placeholder="Optional caption"/></label>
            </> : block.type === "list" ? <>
              {(block.items || []).map((item, j) => <label key={j}>List item {j + 1}<input value={item} maxLength={1000} onChange={e => updateListItem(index, j, e.target.value)}/></label>)}
              <button type="button" onClick={() => addListItem(index)}>Add list item</button>
            </> : <label>{block.type === "heading" ? "Heading text" : block.type === "subheading" ? "Subheading text" : "Paragraph text"}
              <textarea value={block.text} rows={block.type === "paragraph" ? 4 : 2} maxLength={10000} onChange={e => updateBlock(index, "text", e.target.value)}/></label>}
          </fieldset>)}
          <div className="admin-add-blocks"><span>Add content block:</span>
            <button type="button" onClick={() => setForm(old => ({...old, blocks:[...old.blocks, emptyBlock("paragraph")]}))}>Paragraph</button>
            <button type="button" onClick={() => setForm(old => ({...old, blocks:[...old.blocks, emptyBlock("heading")]}))}>Heading</button>
            <button type="button" onClick={() => setForm(old => ({...old, blocks:[...old.blocks, emptyBlock("subheading")]}))}>Subheading</button>
            <button type="button" onClick={() => setForm(old => ({...old, blocks:[...old.blocks, emptyBlock("list")]}))}>List</button>
            <button type="button" onClick={() => setForm(old => ({...old, blocks:[...old.blocks, emptyBlock("image")]}))}>Image</button>
          </div>
          <fieldset className="admin-image-fields"><legend>Optional author byline</legend>
            <p><small>All fields are optional. Only completed fields appear on the public article. Leave all blank to hide the byline.</small></p>
            <label>Author name<input value={form.author_name} maxLength={180} onChange={e => change("author_name", e.target.value)} placeholder="e.g. Jane Doe"/></label>
            <label>Role or title<input value={form.author_role} maxLength={180} onChange={e => change("author_role", e.target.value)} placeholder="e.g. Finance Writer"/></label>
            <label>Organization or department<input value={form.author_organization} maxLength={240} onChange={e => change("author_organization", e.target.value)} placeholder="e.g. Finance Department"/></label>
            <label>Additional affiliation<input value={form.author_affiliation} maxLength={240} onChange={e => change("author_affiliation", e.target.value)} placeholder="e.g. Professional Member"/></label>
          </fieldset>
          <label>SEO title<input value={form.seo_title} maxLength={180} onChange={e => change("seo_title", e.target.value)} placeholder={form.title || "Search result title"}/></label>
          <label>Meta description<textarea value={form.meta_description} maxLength={320} rows={2} onChange={e => change("meta_description", e.target.value)} placeholder={form.summary || "Search-result description"}/></label>
        </div>}
        <div className="admin-articles-actions"><button type="button" onClick={() => setPreview(v => !v)}>{preview ? "Back to editor" : "Preview"}</button>
          <button type="button" className="insights-cta" disabled={saving || preview} onClick={save}>{saving ? "Saving…" : selected ? "Save changes" : "Save draft"}</button>
          {selected?.status === "draft" && <button type="button" disabled={saving || preview} onClick={deleteDraft}>Delete draft</button>}
          {selected?.status === "published" ? <button type="button" disabled={saving} onClick={() => status("draft")}>Unpublish</button> : <button type="button" disabled={saving || preview || !selected} onClick={() => status("published")}>Publish</button>}
        </div>
      </section>
    </div>
  </div>;
}
