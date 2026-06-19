// src/components/SignInModal.js
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInModal({ callbackUrl = "/dashboard" }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setLoading(false);
      if (!res || res.error) {
        setError(res?.error || "Invalid credentials");
        return;
      }
      router.push(callbackUrl);
    } catch (err) {
      setLoading(false);
      setError("Sign-in failed");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
      >
        Sign in
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Sign in
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex items-center justify-between mt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <Link
                  href="/api/auth/signin"
                  className="text-sm text-slate-500 dark:text-slate-300 hover:underline"
                >
                  Sign in page
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
