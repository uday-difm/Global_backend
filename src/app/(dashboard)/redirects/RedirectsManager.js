"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";

export default function RedirectsManager({ siteId, initialRedirects }) {
  const [redirects, setRedirects] = useState(initialRedirects);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [type, setType] = useState("301");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const handleAddRedirect = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      source: source.trim().startsWith("/") ? source.trim() : `/${source.trim()}`,
      target: target.trim(),
      type: Number(type)
    };

    try {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add redirect rule");
      }

      const result = await res.json();
      setRedirects((prev) => [result.redirect, ...prev]);
      setSource("");
      setTarget("");
      setType("301");
      setSuccess("Redirect rule added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this redirect rule?")) return;

    try {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: "DELETE",
        headers: {
          "x-site-id": siteId
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete redirect rule");
      }

      setRedirects((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const runBrokenLinkScanner = async () => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const res = await fetch(`/api/admin/redirects/broken-links`, {
        headers: {
          "x-site-id": siteId
        }
      });

      if (!res.ok) {
        throw new Error("Failed to run broken link scan");
      }

      const result = await res.json();
      setScanResult({
        scannedPages: result.scannedPagesCount,
        scannedPosts: result.scannedPostsCount,
        brokenLinks: result.brokenLinks
      });
    } catch (err) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configure redirects panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Alerts Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
            {success}
          </div>
        )}

        {/* Add Redirect Form */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add New Route Mapping</h3>
          <form onSubmit={handleAddRedirect} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Source Path (URL)</label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
                placeholder="e.g. /old-about"
              />
            </div>

            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Destination Path/URL</label>
              <input
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
                placeholder="e.g. /about"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Redirect Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm bg-white"
              >
                <option value="301">301 - Permanent</option>
                <option value="302">302 - Temporary</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition w-full"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </form>
        </div>

        {/* Redirects rules table */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Active Redirect Rules</h3>
          </div>

          {redirects.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No custom redirects mapping configured.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-gray-700">Source Path</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-700">Destination</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {redirects.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/30 transition">
                      <td className="px-6 py-4 font-mono text-gray-900 text-xs">{item.source}</td>
                      <td className="px-6 py-4 font-mono text-gray-600 text-xs truncate max-w-xs">{item.target}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                          item.type === 301 ? "bg-green-50 text-green-700 border-green-150" : "bg-blue-50 text-blue-700 border-blue-150"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Broken Links Scanner panel */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Broken Links Scanner</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Audit layout sections and action buttons across pages for broken internal relative URLs. Ensure users don't encounter dead ends.
        </p>

        <button
          onClick={runBrokenLinkScanner}
          disabled={isScanning}
          className="flex justify-center items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400 transition w-full"
        >
          {isScanning ? (
            <>
              <RefreshCw className="animate-spin" size={16} />
              Scanning Slugs...
            </>
          ) : (
            <>
              <ShieldAlert size={16} />
              Run Audit Scanner
            </>
          )}
        </button>

        {scanError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg">
            Audit scanner failed: {scanError}
          </div>
        )}

        {scanResult && (
          <div className="space-y-4 pt-2 border-t text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Pages Scanned: {scanResult.scannedPages}</span>
              <span>Posts Scanned: {scanResult.scannedPosts}</span>
            </div>

            {scanResult.brokenLinks.length === 0 ? (
              <div className="flex gap-2 p-3 bg-green-50 border border-green-100 text-green-800 rounded-lg">
                <CheckCircle className="shrink-0" size={16} />
                <div>
                  <strong className="font-semibold">Audit Clean!</strong>
                  <p className="mt-0.5 text-[10px]">No broken links detected on any page buttons or CTAs.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="font-semibold text-red-700 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  Found {scanResult.brokenLinks.length} Broken Link(s)
                </div>

                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {scanResult.brokenLinks.map((link, idx) => (
                    <div key={idx} className="border border-red-100 bg-red-50/30 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between font-semibold text-gray-800">
                        <span>Page: {link.pageSlug}</span>
                        <span className="text-[10px] text-gray-500">{link.context}</span>
                      </div>
                      <div className="font-mono text-[10px] text-red-600 bg-white p-1 rounded border">
                        {link.brokenLink}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
