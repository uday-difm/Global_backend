"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

export default function DeletePostButton({ postId, siteId }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to permanently delete this blog post? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId },
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to delete blog post");
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Network error while deleting post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete post"
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Trash2 size={11} />
      )}
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
