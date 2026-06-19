"use client";

import { useState } from "react";

export default function CategoryManager({ initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setCategories((prev) => [...prev, { ...data.category, _count: { posts: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This will only remove the category association from blog posts, not the posts themselves.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Blog Categories</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New category name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-md transition-colors"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No categories created yet.</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-600">
                  {cat._count?.posts || 0} posts
                </span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={loading}
                className="text-2xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
