// DeleteUserButton.js (client)
"use client";

export default function DeleteUserButton({ userId, targetRole }) {
  async function handleDelete() {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      // don't call res.json() blindly — handle non-JSON or empty responses
      let body = null;
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = { error: text || null };
      }

      if (!res.ok) {
        const message =
          (body && (body.error || body.message)) ||
          `Delete failed — status ${res.status}`;
        alert(message);
        return;
      }

      // success
      window.location.reload();
    } catch (err) {
      console.error("Delete user network error:", err);
      alert("Network error while deleting user");
    }
  }

  return (
    <button
      className="px-2 py-1 bg-red-600 text-white rounded text-xs ml-2"
      onClick={handleDelete}
    >
      Delete
    </button>
  );
}
