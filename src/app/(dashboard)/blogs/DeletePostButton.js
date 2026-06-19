"use client";

import { useState } from "react";

export default function DeletePostButton({ postId }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to delete blog post");
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Network error occurred while trying to delete the blog post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs ml-2 disabled:opacity-50 inline-flex items-center"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
