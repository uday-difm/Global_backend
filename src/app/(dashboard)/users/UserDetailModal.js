// src/app/(dashboard)/users/UserDetailModal.js
"use client";

import { useState, useEffect } from "react";

/*
 UserDetailModal
 Props:
  - userId: id string
 Renders a button "Edit" that opens a modal. Modal fetches user details and allows updating role/isActive and resetting password.
*/

export default function UserDetailModal({ userId }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState("EDITOR");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          setUser(null);
        } else {
          setUser(json.user || null);
          setRole(json.user?.globalRole || "EDITOR");
          setIsActive(Boolean(json.user?.isActive));
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load user");
      })
      .finally(() => setLoading(false));
  }, [open, userId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalRole: role, isActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save");
        setSaving(false);
        return;
      }
      // reload page to update list (simple)
      window.location.reload();
    } catch (e) {
      console.error(e);
      setError("Network error");
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (
      !confirm(
        "Reset this user's password to 'Temp@123' ? (you can change the default)",
      )
    )
      return;
    setSaving(true);
    try {
      // If you have a dedicated admin reset endpoint, use it; otherwise use reset-password by email
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Password reset. (Check email or see API behavior)");
      } else {
        const json = await res.json();
        alert(json.error || "Failed to reset password");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Edit User</h3>
              <button
                className="text-sm text-gray-600"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : user ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <div className="mt-1">{user.email}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Global role
                  </label>
                  <select
                    className="mt-1 block w-full border rounded p-2"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="SUPERADMIN">SUPERADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="AUTHOR">AUTHOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={handleResetPassword}
                    disabled={saving}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ) : (
              <div>No user data</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
