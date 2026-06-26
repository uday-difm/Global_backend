"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Download,
  Search,
  Trash2,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    active: "bg-green-50 text-green-700 border-green-200",
    unsubscribed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${map[status] || "bg-gray-50 text-gray-500 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

export default function NewsletterClient({ siteId }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const headers = {
    "Content-Type": "application/json",
    "x-site-id": siteId,
  };

  async function loadSubscribers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter", { headers });
      if (!res.ok) throw new Error("Failed to load subscribers");
      const data = await res.json();
      setSubscribers(data?.subscribers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (siteId) loadSubscribers();
  }, [siteId]);

  async function handleExport() {
    try {
      const res = await fetch("/api/admin/newsletter/export", { headers });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  }

  async function handleUnsubscribe(id, email) {
    if (
      !confirm(`Unsubscribe "${email}"? This will mark them as unsubscribed.`)
    )
      return;
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to unsubscribe");
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "unsubscribed" } : s)),
      );
      setSuccess(`Unsubscribed ${email}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  }

  const filtered = useMemo(() => {
    let items = subscribers;
    if (filterStatus !== "all") {
      items = items.filter((s) => s.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((s) => s.email.toLowerCase().includes(q));
    }
    return items;
  }, [subscribers, filterStatus, search]);

  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter((s) => s.status === "active").length;
    const unsubscribed = subscribers.filter(
      (s) => s.status === "unsubscribed",
    ).length;
    return { total, active, unsubscribed };
  }, [subscribers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your email subscribers and newsletter list.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={subscribers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={loadSubscribers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Active
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats.active}
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Unsubscribed
          </div>
          <div className="text-2xl font-bold text-red-500 mt-1">
            {stats.unsubscribed}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
          <CheckCircle size={14} />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Loading subscribers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <Mail size={24} className="mx-auto mb-2 text-gray-300" />
            {search || filterStatus !== "all"
              ? "No subscribers match your filters."
              : "No subscribers yet. They will appear here when people sign up."}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sub.status === "active" && (
                      <button
                        onClick={() => handleUnsubscribe(sub.id, sub.email)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                        title="Unsubscribe"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
