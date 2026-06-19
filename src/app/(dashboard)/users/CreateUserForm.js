// src/app/(dashboard)/users/CreateUserForm.js
"use client";

import { useState, useEffect } from "react";

/*
 CreateUserForm (client)
 - Renders a button; opens modal to create a user
 - Calls POST /api/admin/users
*/ const ROLE_LEVEL = {
  SUPERADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  VIEWER: 1,
};

export default function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirm("");
    setRole("EDITOR");
    setError(null);
  }

  async function handleCreate() {
    setError(null);
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, globalRole: role }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Surface the first Zod field error if available, otherwise use top-level error
        const detail = json.details?.[0];
        const msg = detail
          ? `${detail.path?.join(".") || "field"}: ${detail.message}`
          : json.error || "Failed to create user";
        setError(msg);
        setLoading(false);
        return;
      }
      // success: reload page to show new user (simple)
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Network error");
      setLoading(false);
    }
  }
  const [creatorRole, setCreatorRole] = useState(null);
  const allRoles = ["SUPERADMIN", "ADMIN", "EDITOR", "AUTHOR", "VIEWER"];
  const allowedRoles = creatorRole
    ? allRoles.filter(
        (r) => (ROLE_LEVEL[r] || 0) <= (ROLE_LEVEL[creatorRole] || 0),
      )
    : ["EDITOR", "AUTHOR", "VIEWER"]; // fallback if session missing
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const role = json?.user?.globalRole || null;
        setCreatorRole(role);
      })
      .catch(() => {
        if (mounted) setCreatorRole(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <button
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        Create User
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded shadow p-6">
            <h3 className="text-lg font-medium mb-4">Create User</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  className="mt-1 block w-full border rounded p-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Password
                  <span className="ml-1 text-xs font-normal text-gray-400">(min 6 chars)</span>
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full border rounded p-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Confirm password
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full border rounded p-2"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Global role</label>

                <select
                  className="mt-1 block w-full border rounded p-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
