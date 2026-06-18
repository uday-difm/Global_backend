// global_backend/src/app/(dashboard)/pages/PublishToggle.js
"use client";

import { useState } from "react";

/*
 PublishToggle client component
 Props:
  - pageId: string
  - initialStatus: "DRAFT" | "PUBLISHED"
*/
export default function PublishToggle({ pageId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const newStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to update page status");
      } else {
        setStatus(json.page?.status ?? newStatus);
      }
    } catch (err) {
      console.error("Toggle publish error", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-2 py-1 text-xs rounded ${status === "PUBLISHED" ? "bg-gray-200 text-black" : "bg-gray-200 text-black"}`}
      title={status === "PUBLISHED" ? "Unpublish" : "Publish"}
    >
      {loading ? "..." : status === "PUBLISHED" ? "Unpublish" : "Publish"}
    </button>
  );
}
