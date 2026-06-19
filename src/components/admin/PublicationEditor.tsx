"use client";

/**
 * Bilingual, RTL-safe, accessible TipTap rich-text editor for authoring a publication
 * body. Replaces the raw "Body (HTML)" textarea in the publications admin form.
 *
 * The editor emits the body as a TipTap doc JSON STRING via `onChange` on every update,
 * so the admin client always submits JSON — which the POST/PATCH route then validates
 * (parseTiptapDoc) and sanitizes (sanitizeDocLinks) server-side. The render layer
 * (publication-render.ts) + the write validation are the real safety net; this client
 * editor is author convenience plus the FIRST of the three link-href guards.
 *
 * The extension set is the SHARED `publicationEditorExtensions` (publication-extensions.ts)
 * so author-time and render-time schemas cannot drift.
 */

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { publicationEditorExtensions, isAllowedPublicationHref } from "@/lib/publication-extensions";

interface PublicationEditorProps {
  /** Current body — a TipTap JSON string, a legacy raw-HTML string, or "". */
  value: string;
  /** Called with the body as a TipTap doc JSON string on every editor update. */
  onChange: (json: string) => void;
  locale: string;
}

/** Parse a stored value into editor content: a TipTap doc when the string is one, else
 *  the raw value handed to TipTap as best-effort prose (legacy HTML / non-JSON). The
 *  write-validation + render sanitizer are the security boundary, not this parse. */
function initialContent(value: string): object | string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
  } catch {
    // not JSON — fall through to raw string (legacy HTML)
  }
  return value;
}

export function PublicationEditor({ value, onChange, locale }: PublicationEditorProps) {
  const t = useTranslations("publications.editor");
  const dir = locale === "ar" ? "rtl" : "ltr";

  const editor = useEditor({
    // immediatelyRender:false avoids an SSR/client hydration mismatch under Next App Router.
    immediatelyRender: false,
    extensions: publicationEditorExtensions(t("placeholder")),
    content: initialContent(value),
    editorProps: {
      attributes: {
        dir,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": t("contentLabel"),
        class: "ProseMirror pub-editor-surface",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  // Keep the content direction in sync if the locale changes while mounted.
  useEffect(() => {
    if (editor) {
      editor.setOptions({ editorProps: { attributes: { dir } } });
    }
  }, [editor, dir]);

  if (!editor) {
    return <div className="pub-editor" aria-busy="true" />;
  }

  return (
    <div className="pub-editor" dir={dir}>
      <EditorToolbar editor={editor} t={t} />
      <EditorContent editor={editor} className="pub-editor-content" />
    </div>
  );
}

/* ----------------------------- toolbar ----------------------------- */

type T = ReturnType<typeof useTranslations>;

function EditorToolbar({ editor, t }: { editor: Editor; t: T }) {
  function setLink() {
    const previous = editor.getAttributes("link").href ?? "";
    const input = window.prompt(t("linkPrompt"), previous);
    if (input === null) return; // cancelled
    const trimmed = input.trim();
    if (trimmed === "") {
      // empty -> unset any existing link
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isAllowedPublicationHref(trimmed)) {
      window.alert(t("invalidUrl"));
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  return (
    <div className="pub-editor-toolbar" role="toolbar" aria-label={t("toolbarLabel")}>
      <ToolbarButton
        label={t("h2")}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label={t("h3")}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        label={t("bold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label={t("italic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label={t("bulletList")}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label={t("orderedList")}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label={t("blockquote")}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;
      </ToolbarButton>
      <ToolbarButton label={t("link")} active={editor.isActive("link")} onClick={setLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton
        label={t("unlink")}
        active={false}
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        ⛓
      </ToolbarButton>
      <ToolbarButton
        label={t("undo")}
        active={false}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        label={t("redo")}
        active={false}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </ToolbarButton>
      {/* FUTURE: image embedding (out of scope v1) */}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="pub-editor-btn"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
