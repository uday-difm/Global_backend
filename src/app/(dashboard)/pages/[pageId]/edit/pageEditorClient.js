"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import HeroEditorModal from "./HeroEditorModal";
import TextBlockEditorModal from "./TextEditorModal";

/*
  Tailwind-styled Page Editor Client (updated)
  - Shows validation error panel when server returns validation details
  - Uses next/image with fill for thumbnails/hero preview
  - Hooks into the section endpoints (create/list/update/delete/reorder)
*/

export default function PageEditorClient({ pageId, siteId, pageTitle }) {
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);
  const [showTextBlockModal, setShowTextBlockModal] = useState(false);
  const [textBlockSaving, setTextBlockSaving] = useState(false);

  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rawContent, setRawContent] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  // validation UI state
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  function flash(msg, ms = 3500) {
    setMessage(msg);
    setTimeout(() => setMessage(null), ms);
  }

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "-");

  // parse server validation response
  function parseValidationResponse(json) {
    if (!json) return [{ path: "", message: "Unknown validation error" }];
    if (Array.isArray(json.details)) {
      return json.details.map((d) => {
        const path = Array.isArray(d.path)
          ? d.path.join(".")
          : String(d.path || "");
        const message = d.message || JSON.stringify(d);
        return { path, message };
      });
    }
    return [
      { path: "", message: json.message || json.error || "Validation failed" },
    ];
  }
  async function createTextBlock(content) {
    if (!pageId) return flash("pageId missing");
    setTextBlockSaving(true);
    try {
      const payload = { type: "TEXT_BLOCK", content };
      const res = await fetch(`/api/admin/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 400 && json.error === "Validation failed") {
          const errs = parseValidationResponse(json);
          setValidationErrors(errs);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to create text block");
        return;
      }
      setSections((s) => [...s, json.section]);
      setShowTextBlockModal(false);
      flash("Text block created");
    } catch (err) {
      console.error("createTextBlock error", err);
      flash("Network error creating text block");
    } finally {
      setTextBlockSaving(false);
    }
  }
  async function updateTextBlock(sectionId, content) {
    if (!pageId) return flash("pageId missing");
    setTextBlockSaving(true);
    try {
      const res = await fetch(
        `/api/admin/pages/${pageId}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 400 && json.error === "Validation failed") {
          const errs = parseValidationResponse(json);
          setValidationErrors(errs);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to update text block");
        return;
      }
      setSections((list) =>
        list.map((it) => (it.id === json.section.id ? json.section : it)),
      );
      setShowTextBlockModal(false);
      flash("Text block updated");
    } catch (err) {
      console.error("updateTextBlock error", err);
      flash("Network error updating text block");
    } finally {
      setTextBlockSaving(false);
    }
  }

  async function fetchSections() {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections`);
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to load sections");
        setSections([]);
        return;
      }
      setSections(Array.isArray(json.sections) ? json.sections : []);
    } catch (err) {
      console.error(err);
      flash("Network error loading sections");
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSections();
  }, [pageId]);

  async function addSection(type = "TEXT_BLOCK") {
    if (!pageId) return flash("pageId missing");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: { body: "" } }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log("DEBUG: section API error response:", res.status, json);
        if (res.status === 400 && json.error === "Validation failed") {
          const errors = parseValidationResponse(json);
          setValidationErrors(errors);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to create/save section");
        return;
      }

      setValidationErrors([]);
      setShowValidationErrors(false);
      setSections((s) => [...s, json.section]);
      flash("Section created");
    } catch (err) {
      console.error(err);
      flash("Network error creating section");
    } finally {
      setActionLoading(false);
    }
  }

  function selectSection(sec) {
    setSelected(sec);
    setRawContent(JSON.stringify(sec.content ?? {}, null, 2));
    setValidationErrors([]);
    setShowValidationErrors(false);
  }
  async function createHero(content) {
    if (!pageId) return flash("pageId missing");
    setHeroSaving(true);
    try {
      const payload = { type: "HERO", content };
      const res = await fetch(`/api/admin/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 400 && json.error === "Validation failed") {
          const errors = parseValidationResponse(json);
          setValidationErrors(errors);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to create hero");
        return;
      }
      setSections((s) => [...s, json.section]);
      setShowHeroModal(false);
      flash("Hero section created");
    } catch (err) {
      console.error("createHero error", err);
      flash("Network error creating hero");
    } finally {
      setHeroSaving(false);
    }
  }

  async function saveSection() {
    if (!pageId || !selected) return;
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      return flash("Invalid JSON");
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/pages/${pageId}/sections/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: parsed }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        console.log("DEBUG: section API error response:", res.status, json);
        if (res.status === 400 && json.error === "Validation failed") {
          const errors = parseValidationResponse(json);
          setValidationErrors(errors);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to create/save section");
        return;
      }

      setValidationErrors([]);
      setShowValidationErrors(false);
      setSections((list) =>
        list.map((it) => (it.id === json.section.id ? json.section : it)),
      );
      setSelected(json.section);
      flash("Saved");
    } catch (err) {
      console.error(err);
      flash("Network error saving section");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleVisibility(sec) {
    if (!pageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections/${sec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !sec.isVisible }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to toggle visibility");
        return;
      }
      setSections((list) =>
        list.map((it) => (it.id === json.section.id ? json.section : it)),
      );
      flash(json.section.isVisible ? "Shown" : "Hidden");
    } catch (err) {
      console.error(err);
      flash("Network error toggling visibility");
    } finally {
      setActionLoading(false);
    }
  }

  async function moveSection(sec, toOrder) {
    if (!pageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections/${sec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: toOrder }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to move section");
        return;
      }
      await fetchSections();
    } catch (err) {
      console.error(err);
      flash("Network error moving section");
    } finally {
      setActionLoading(false);
    }
  }

  async function createHero(content) {
    if (!pageId) return flash("pageId missing");
    setHeroSaving(true);
    try {
      const payload = { type: "HERO", content };
      const res = await fetch(`/api/admin/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        // surface validation details if present
        if (res.status === 400 && json.error === "Validation failed") {
          const errors = parseValidationResponse(json);
          setValidationErrors(errors);
          setShowValidationErrors(true);
          document
            .getElementById("validation-errors")
            ?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        flash(json.error || "Failed to create hero");
        return;
      }
      // success: add returned section and close modal
      setSections((s) => [...s, json.section]);
      setShowHeroModal(false);
      flash("Hero section created");
    } catch (err) {
      console.error("createHero error", err);
      flash("Network error creating hero");
    } finally {
      setHeroSaving(false);
    }
  }

  async function reorderByIds(orderedIds) {
    if (!pageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to reorder");
        return;
      }
      await fetchSections();
      flash("Reordered");
    } catch (err) {
      console.error(err);
      flash("Network error reordering");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteSection(sec) {
    if (!confirm("Delete this section?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/sections/${sec.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to delete section");
        return;
      }
      setSections((list) => list.filter((it) => it.id !== sec.id));
      if (selected?.id === sec.id) {
        setSelected(null);
        setRawContent("{}");
      }
      flash("Deleted");
    } catch (err) {
      console.error(err);
      flash("Network error deleting");
    } finally {
      setActionLoading(false);
    }
  }

  async function openMediaPicker() {
    setShowMediaPicker(true);
    if (mediaList.length) return;
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/media`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to list media");
      const list = Array.isArray(json) ? json : json.media ? json.media : [];
      setMediaList(list);
    } catch (err) {
      console.error(err);
      flash("Failed to load media");
    } finally {
      setMediaLoading(false);
    }
  }

  async function attachMediaToSection(media) {
    if (!selected) return flash("No section selected");
    const newContent = {
      ...(selected.content || {}),
      bannerMediaId: media.id,
      bannerUrl: media.secureUrl || media.url,
    };
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/pages/${pageId}/sections/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        flash(json.error || "Failed to attach media");
        return;
      }
      setSections((list) =>
        list.map((it) => (it.id === json.section.id ? json.section : it)),
      );
      setSelected(json.section);
      setShowMediaPicker(false);
      flash("Media attached");
    } catch (err) {
      console.error(err);
      flash("Network error attaching media");
    } finally {
      setActionLoading(false);
    }
  }

  function moveUp(sec) {
    if (sec.order == null || sec.order <= 0) return;
    moveSection(sec, sec.order - 1);
  }
  function moveDown(sec) {
    moveSection(sec, (sec.order ?? 0) + 1);
  }
  async function moveToTop(sec) {
    const ids = [
      sec.id,
      ...sections.filter((s) => s.id !== sec.id).map((s) => s.id),
    ];
    await reorderByIds(ids);
  }

  function contentPreview(content) {
    if (!content) return "";
    if (typeof content === "string") return content.slice(0, 150);
    if (content.title) return content.title;
    if (content.text) return content.text.slice(0, 150);
    if (content.subtitle) return content.subtitle;
    try {
      const json = JSON.stringify(content);
      return json.length > 150 ? json.slice(0, 150) + "…" : json;
    } catch {
      return "";
    }
  }
  function editSectionOrOpenModal(s) {
    if (s.type === "TEXT_BLOCK") {
      // open structured editor modal with initial content
      setSelected(s);
      setShowTextBlockModal(true);
    } else {
      selectSection(s);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Page Editor</h1>
        <div className="space-x-2">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowTextBlockModal(true)}
            disabled={actionLoading}
          >
            Add Text Block
          </button>

          <button
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => setShowHeroModal(true)}
            disabled={actionLoading}
          >
            Add Hero
          </button>

          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => fetchSections()}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            onClick={() => {
              const url = `/preview?pageId=${encodeURIComponent(pageId)}&siteId=${encodeURIComponent(siteId)}`;
              window.open(url, "_blank");
            }}
            disabled={!pageId || !siteId}
          >
            Preview
          </button>
        </div>
      </div>

      {message && <div className="mb-4 text-sm text-green-700">{message}</div>}

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="bg-white shadow rounded p-4">
            <h2 className="font-medium mb-2">Sections ({sections.length})</h2>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <svg
                  className="animate-spin h-6 w-6 text-gray-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              </div>
            ) : sections.length === 0 ? (
              <div className="text-sm text-gray-500">No sections yet</div>
            ) : (
              <ul className="space-y-3 max-h-[60vh] overflow-auto">
                {sections.map((s) => (
                  <li key={s.id} className="border rounded p-3 hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-800">
                            {s.type}
                          </span>
                          <span className="text-xs text-slate-500">
                            #{s.id.slice(0, 6)}
                          </span>
                          <span className="text-sm font-medium text-slate-700">
                            Order {s.order}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                          {contentPreview(s.content)}
                        </div>
                      </div>

                      <div className="text-right ml-3">
                        <div className="text-xs text-slate-500">
                          {s.isVisible ? (
                            <span className="text-green-600">Visible</span>
                          ) : (
                            <span className="text-red-600">Hidden</span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {formatDate(s.updatedAt)}
                        </div>
                      </div>
                    </div>

                    {s.content?.bannerUrl && (
                      <div className="mt-3 relative w-full h-28 rounded-md overflow-hidden">
                        <Image
                          src={s.content.bannerUrl}
                          alt={s.content.altText || ""}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, 600px"
                          loading="eager"
                        />
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                        onClick={() => selectSection(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                        onClick={() => toggleVisibility(s)}
                      >
                        {s.isVisible ? "Hide" : "Show"}
                      </button>
                      <button
                        className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                        onClick={() => moveUp(s)}
                        disabled={s.order === 0}
                      >
                        Up
                      </button>
                      <button
                        className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                        onClick={() => moveDown(s)}
                      >
                        Down
                      </button>
                      <button
                        className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                        onClick={() => moveToTop(s)}
                      >
                        To Top
                      </button>
                      <button
                        className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => deleteSection(s)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {selected
                  ? `${selected.type} (Order ${selected.order})`
                  : "Select a section to edit"}
              </h2>
              <div className="text-sm text-slate-500">
                {selected && (
                  <div>
                    Created: {formatDate(selected.createdAt)} · Updated:{" "}
                    {formatDate(selected.updatedAt)}
                  </div>
                )}
              </div>
            </div>

            {showValidationErrors && validationErrors.length > 0 && (
              <div
                id="validation-errors"
                className="mb-4 border-l-4 border-red-500 bg-red-50 p-3 rounded"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-red-700">
                      Validation Errors
                    </div>
                    <div className="mt-1 text-sm text-red-600">
                      Please fix the following fields:
                    </div>
                  </div>
                  <button
                    className="text-xs text-red-500 underline"
                    onClick={() => {
                      setShowValidationErrors(false);
                    }}
                  >
                    Dismiss
                  </button>
                </div>

                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {validationErrors.map((e, i) => (
                    <li key={i}>
                      <strong className="text-red-800">
                        {e.path || "(general)"}
                      </strong>
                      : {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!selected ? (
              <div className="text-slate-500">
                Choose a section from the left to view details and edit its
                content.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Content (JSON)
                  </label>
                  <textarea
                    className="w-full h-72 border rounded p-3 font-mono text-sm"
                    value={rawContent}
                    onChange={(e) => {
                      setRawContent(e.target.value);
                      setValidationErrors([]);
                      setShowValidationErrors(false);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={saveSection}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={openMediaPicker}
                    disabled={actionLoading}
                  >
                    Attach Media
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => {
                      setSelected(null);
                      setRawContent("{}");
                    }}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Content Preview</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {contentPreview(selected.content)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setShowMediaPicker(false)}
          />
          <div className="relative bg-white rounded shadow-lg w-full max-w-4xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Media Picker</h3>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setShowMediaPicker(false)}
              >
                Close
              </button>
            </div>

            {mediaLoading ? (
              <div className="flex items-center justify-center py-10">
                Loading media...
              </div>
            ) : mediaList.length === 0 ? (
              <div className="text-sm text-slate-500">
                No media found. Upload via Media page first.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-auto">
                {mediaList.map((m) => (
                  <div key={m.id} className="border rounded p-2">
                    <div className="relative w-full h-28 rounded overflow-hidden">
                      <Image
                        src={m.secureUrl || m.url}
                        alt={m.altText || m.fileName || ""}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="200px"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-slate-600 truncate">
                        {m.originalName || m.fileName}
                      </div>
                      <button
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        onClick={() => attachMediaToSection(m)}
                      >
                        Attach
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showHeroModal && (
        <HeroEditorModal
          onCancel={() => setShowHeroModal(false)}
          onSave={(content) => createHero(content)}
          saving={heroSaving}
        />
      )}
      {showTextBlockModal && (
        <TextBlockEditorModal
          initial={
            selected && selected.type === "TEXT_BLOCK" ? selected.content : {}
          }
          onCancel={() => {
            setShowTextBlockModal(false);
            setSelected(null);
          }}
          onSave={(content) => {
            if (selected && selected.type === "TEXT_BLOCK") {
              // updating existing section
              updateTextBlock(selected.id, content);
            } else {
              // creating new section
              createTextBlock(content);
            }
          }}
          saving={textBlockSaving}
        />
      )}
    </div>
  );
}
