// src/components/NewsletterForm.js
"use client";
import { useState } from "react";

export default function NewsletterForm({ siteId = "" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: "Newsletter Subscriber",
          email,
          message: "Subscribe to newsletter",
          _hp: "",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: json.error || "Subscription failed" });
        setLoading(false);
        return;
      }
      setMsg({
        type: "success",
        text: "Thanks — check your email if auto-reply is enabled",
      });
      setEmail("");
    } catch (err) {
      setMsg({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        className="flex-1 border rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
      >
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
      {msg && (
        <div
          className={`ml-3 text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}
