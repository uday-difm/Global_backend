"use client";

import { useState } from "react";
import { Download, Edit2, Trash2, X } from "lucide-react";

export default function LeadsManager({ siteId, initialSubmissions, initialLeads }) {
  const [activeTab, setActiveTab] = useState("submissions"); // "submissions" | "leads"
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [leads, setLeads] = useState(initialLeads);
  const [selectedItem, setSelectedItem] = useState(null); // Item to edit notes/status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setNotes(item.notes || "");
    setStatus(item.status || "new");
    setError(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setError(null);

    const isSubmission = activeTab === "submissions";
    const endpoint = isSubmission
      ? `/api/admin/forms/submissions/${selectedItem.id}`
      : `/api/admin/leads/${selectedItem.id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify({ status, notes })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update item");
      }

      const updated = await res.json();
      
      if (isSubmission) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === selectedItem.id ? { ...s, status, notes } : s))
        );
      } else {
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedItem.id ? { ...l, status, notes } : l))
        );
      }

      handleModalClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const isSubmission = activeTab === "submissions";
    // Standard leads endpoint has delete support. Submissions deletion fallback:
    const endpoint = isSubmission
      ? `/api/admin/forms/submissions/${id}` // Let's check API definition, if deletion is needed
      : `/api/admin/leads/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "x-site-id": siteId
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete record");
      }

      if (isSubmission) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      } else {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (statusVal) => {
    const base = "px-2.5 py-1 text-xs font-semibold rounded-full border ";
    switch (statusVal) {
      case "new":
        return `${base} bg-blue-50 text-blue-700 border-blue-200`;
      case "read":
      case "contacted":
        return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case "qualified":
        return `${base} bg-green-50 text-green-700 border-green-200`;
      case "closed":
        return `${base} bg-gray-100 text-gray-700 border-gray-300`;
      case "spam":
        return `${base} bg-red-50 text-red-700 border-red-200`;
      default:
        return `${base} bg-gray-50 text-gray-500 border-gray-200`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs and Actions bar */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "submissions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Contact Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "leads"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Leads CRM ({leads.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "submissions" ? (
            <a
              href={`/api/admin/forms/export?siteId=${siteId}`}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Download size={16} />
              Export Submissions CSV
            </a>
          ) : (
            <a
              href={`/api/admin/leads/export?siteId=${siteId}`}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Download size={16} />
              Export Leads CSV
            </a>
          )}
        </div>
      </div>

      {/* Tables section */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {activeTab === "submissions" ? (
          submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Message</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{sub.name}</div>
                        <div className="text-gray-500">{sub.email}</div>
                        {sub.phone && <div className="text-xs text-gray-400">{sub.phone}</div>}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        <p className="truncate text-gray-700">{sub.message}</p>
                        {sub.notes && (
                          <p className="text-xs text-gray-500 italic mt-1 truncate">
                            Note: {sub.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(sub.status)}>{sub.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(sub)}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 inline-flex"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(sub.id)}
                          className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 inline-flex"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Lead Info</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Interest / Source</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{lead.name}</div>
                      <div className="text-gray-500">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">{lead.serviceInterest || "N/A"}</div>
                      <div className="text-xs text-gray-400">{lead.sourcePage || "Direct"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(lead.status)}>{lead.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(lead)}
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 inline-flex"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(lead.id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 inline-flex"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "submissions" ? "Submission Details" : "Lead Details"}
              </h3>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Contact:</span>
                <span className="col-span-2 text-gray-900">
                  {selectedItem.name} ({selectedItem.email})
                </span>
              </div>
              {selectedItem.phone && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold text-gray-600">Phone:</span>
                  <span className="col-span-2 text-gray-900">{selectedItem.phone}</span>
                </div>
              )}
              {activeTab === "submissions" ? (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold text-gray-600 text-top">Message:</span>
                  <p className="col-span-2 text-gray-800 bg-gray-50 p-2.5 rounded-lg border font-sans whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                    {selectedItem.message}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-600">Service:</span>
                    <span className="col-span-2 text-gray-900">
                      {selectedItem.serviceInterest || "N/A"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-600">Source Page:</span>
                    <span className="col-span-2 text-gray-900">
                      {selectedItem.sourcePage || "Direct"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 bg-white"
                >
                  {activeTab === "submissions" ? (
                    <>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="spam">Spam</option>
                      <option value="archived">Archived</option>
                    </>
                  ) : (
                    <>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="closed">Closed / Won</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 font-sans"
                  placeholder="Add notes about conversations or status updates..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
