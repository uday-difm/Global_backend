// global_backend/src/app/(dashboard)/pages/CreatePageForm.js
"use client";

import { useState } from "react";

/*
 Simple Create Page form (client).
 Props:
  - siteId: the current site id
 Behavior:
  - Opens a small form to create a page (title + slug optional)
  - Calls POST /api/admin/pages
  - On success, reloads the page to show the new page in the list
*/

export default function CreatePageForm({ siteId }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify({
          siteId,
          title: title.trim(),
          slug: slug.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create page");
        setSaving(false);
        return;
      }
      // success — reload to show the new page
      window.location.reload();
    } catch (err) {
      console.error("create page error", err);
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => setShow(true)}
      >
        Create Page
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setShow(false)}
          />
          <div className="relative bg-white rounded shadow p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-medium mb-4">Create Page</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="mt-1 block w-full border rounded p-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Slug (optional)
                </label>
                <input
                  className="mt-1 block w-full border rounded p-2"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate from title
                </div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => setShow(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={handleCreate}
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
