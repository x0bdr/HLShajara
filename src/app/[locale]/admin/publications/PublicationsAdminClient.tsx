"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { PublicationEditor } from "@/components/admin/PublicationEditor";

interface Post {
  id: number;
  slug: string;
  locale: string;
  status: "draft" | "published" | "archived";
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: number | null;
}

const emptyForm = {
  id: 0,
  slug: "",
  locale: "ar",
  title: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  status: "draft" as "draft" | "published" | "archived",
  publishedAt: "",
};

export default function PublicationsAdminClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts/admin");
      const data = await res.json();
      if (data.ok) setPosts(data.posts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...emptyForm, locale });
    setIsEditing(false);
    setModalOpen(true);
  }

  function openEdit(post: Post) {
    setForm({
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      title: post.title,
      excerpt: post.excerpt || "",
      body: "",
      coverImageUrl: post.coverImageUrl || "",
      status: post.status,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "",
    });
    setIsEditing(true);
    setModalOpen(true);
    // Fetch full post body
    fetch(`/api/posts/admin?id=${post.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.post) {
          setForm((f) => ({ ...f, body: data.post.body || "" }));
        }
      });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = isEditing
        ? { ...form, id: form.id }
        : { ...form };

      const res = await fetch("/api/posts/admin", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.message || "Save failed");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      await fetchPosts();
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: number) {
    if (!confirm(locale === "ar" ? "أرشفة هذا المنشور؟" : "Archive this post?")) return;
    try {
      const res = await fetch(`/api/posts/admin?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) {
        alert(data.message || "Archive failed");
        return;
      }
      await fetchPosts();
    } catch {
      alert("Network error");
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      draft: "status-draft",
      published: "status-published",
      archived: "status-archived",
    };
    return <span className={`status-pill ${map[status] || ""}`}>{status}</span>;
  }

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn primary" onClick={openCreate}>
          {locale === "ar" ? "+ منشور جديد" : "+ New Post"}
        </button>
      </div>

      {loading ? (
        <p className="ds-body empty-text">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="card empty-state">
          <p className="ds-body text-fg2">
            {locale === "ar" ? "لا توجد منشورات." : "No posts yet."}
          </p>
        </div>
      ) : (
        <div className="reviewer-grid">
          {posts.map((post) => (
            <div key={post.id} className="reviewer-card">
              <div className="rc-head">
                <div style={{ minWidth: 0 }}>
                  <div className="rc-name" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {post.title}
                    {statusBadge(post.status)}
                  </div>
                  <div className="rc-meta">
                    /{post.locale}/publications/{post.slug}
                    {post.publishedAt && (
                      <span style={{ marginInlineStart: 8 }}>
                        · {new Date(post.publishedAt).toLocaleDateString(locale === "ar" ? "ar-SY" : "en-GB")}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn primary btn-sm" onClick={() => openEdit(post)}>
                    {locale === "ar" ? "تعديل" : "Edit"}
                  </button>
                  <button className="btn danger btn-sm" onClick={() => handleArchive(post.id)}>
                    {locale === "ar" ? "أرشفة" : "Archive"}
                  </button>
                </div>
              </div>
              {post.excerpt && <p className="rc-desc">{post.excerpt}</p>}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="modal-panel" style={{ maxWidth: 720, width: "90vw", maxHeight: "90vh", overflow: "auto" }}>
            <div className="modal-header">
              <div className="ds-h2">
                {isEditing
                  ? (locale === "ar" ? "تعديل منشور" : "Edit Post")
                  : (locale === "ar" ? "منشور جديد" : "New Post")}
              </div>
              <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-field">
                <label>{locale === "ar" ? "العنوان" : "Title"}</label>
                <input
                  className="ds-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-field">
                  <label>{locale === "ar" ? "المعرف (slug)" : "Slug"}</label>
                  <input
                    className="ds-input"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>{locale === "ar" ? "اللغة" : "Locale"}</label>
                  <select
                    className="ds-input"
                    value={form.locale}
                    onChange={(e) => setForm({ ...form, locale: e.target.value })}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>{locale === "ar" ? "الملخص" : "Excerpt"}</label>
                <input
                  className="ds-input"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>{locale === "ar" ? "رابط الغلاف" : "Cover Image URL"}</label>
                <input
                  className="ds-input"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-field">
                <label>{locale === "ar" ? "المحتوى" : "Content"}</label>
                <PublicationEditor
                  value={form.body}
                  onChange={(json) => setForm((f) => ({ ...f, body: json }))}
                  locale={locale}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-field">
                  <label>{locale === "ar" ? "الحالة" : "Status"}</label>
                  <select
                    className="ds-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Post["status"] })}
                  >
                    <option value="draft">{locale === "ar" ? "مسودة" : "Draft"}</option>
                    <option value="published">{locale === "ar" ? "منشور" : "Published"}</option>
                  </select>
                </div>
                {form.status === "published" && (
                  <div className="form-field">
                    <label>{locale === "ar" ? "تاريخ النشر" : "Publish Date"}</label>
                    <input
                      type="datetime-local"
                      className="ds-input"
                      value={form.publishedAt}
                      onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn secondary" onClick={() => setModalOpen(false)}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? (locale === "ar" ? "جاري الحفظ..." : "Saving...")
                    : (locale === "ar" ? "حفظ" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
