"use client";

import { useState } from "react";

export default function DeleteServiceButton({ serviceId, siteId }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action is permanent and cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          "x-site-id": siteId,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to delete service");
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Delete service error:", err);
      alert("Network error occurred while trying to delete the service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs ml-2 disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
