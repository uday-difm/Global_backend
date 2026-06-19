"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Plus, Trash2, Edit, AlertCircle, HelpCircle, Save, CheckCircle } from "lucide-react";

export default function ServiceEditor({ siteId, service }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    ctaButtonText: "",
    ctaButtonLink: "",
    sortOrder: 0,
    status: "DRAFT",
    featuredImageId: null,
  });

  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Media Picker states
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // FAQs states
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqSortOrder, setFaqSortOrder] = useState(0);
  const [faqShowHide, setFaqShowHide] = useState(true);
  const [faqSchemaMarkup, setFaqSchemaMarkup] = useState(false);

  const isEditMode = !!service;

  // Load service data
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        price: service.price || "",
        ctaButtonText: service.ctaButtonText || "",
        ctaButtonLink: service.ctaButtonLink || "",
        sortOrder: service.sortOrder || 0,
        status: service.status || "DRAFT",
        featuredImageId: service.featuredImageId || null,
      });

      if (service.featuredImage) {
        setFeaturedImageUrl(service.featuredImage.secureUrl || service.featuredImage.url || "");
      }
      fetchFaqs();
    }
  }, [service, isEditMode]);

  // Fetch all FAQs and filter by page slug mapping
  const fetchFaqs = async () => {
    if (!isEditMode) return;
    setFaqsLoading(true);
    try {
      const res = await fetch(`/api/admin/faq`);
      const json = await res.json();
      if (res.ok) {
        const filtered = (json.faqs || []).filter(
          (f) => f.page === `/services/${service.id}`
        );
        setFaqs(filtered);
      }
    } catch (err) {
      console.error("Fetch FAQs error:", err);
    } finally {
      setFaqsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }));
  };

  // Submit main service data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const serviceData = { ...formData, siteId };

    const url = isEditMode
      ? `/api/admin/services/${service.id}`
      : "/api/admin/services";
      
    const method = isEditMode ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save service");
      }

      router.push("/services");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media picker helpers
  const openMediaPicker = async () => {
    setShowMediaPicker(true);
    if (mediaList.length > 0) return;
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/media`);
      const json = await res.json();
      if (res.ok) {
        setMediaList(json.media || json || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  const attachImage = (media) => {
    setFormData((prev) => ({ ...prev, featuredImageId: media.id }));
    setFeaturedImageUrl(media.secureUrl || media.url);
    setShowMediaPicker(false);
  };

  // FAQ CRUD helpers
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      page: `/services/${service.id}`,
      sortOrder: Number(faqSortOrder),
      showHide: faqShowHide,
      schemaMarkup: faqSchemaMarkup,
    };

    const url = editingFaq ? `/api/admin/faq/${editingFaq.id}` : `/api/admin/faq`;
    const method = editingFaq ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to save FAQ");
      }

      setShowFaqModal(false);
      fetchFaqs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/admin/faq/${faqId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete FAQ");
      fetchFaqs();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            <AlertCircle className="shrink-0" size={18} />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-xs font-semibold text-gray-500 mb-1">
              Service Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-semibold"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-gray-500 mb-1">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-xs font-semibold text-gray-500 mb-1">
              Price
            </label>
            <input
              type="text"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
              placeholder="e.g., $500 or Contact for Quote"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-gray-500 mb-1">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active (Published)</option>
            </select>
          </div>

          <div>
            <label htmlFor="ctaButtonText" className="block text-xs font-semibold text-gray-500 mb-1">
              CTA Button Text
            </label>
            <input
              type="text"
              name="ctaButtonText"
              id="ctaButtonText"
              value={formData.ctaButtonText}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
              placeholder="e.g., Learn More"
            />
          </div>

          <div>
            <label htmlFor="ctaButtonLink" className="block text-xs font-semibold text-gray-500 mb-1">
              CTA Button Link
            </label>
            <input
              type="text"
              name="ctaButtonLink"
              id="ctaButtonLink"
              value={formData.ctaButtonLink}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
              placeholder="e.g., /contact-us"
            />
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-xs font-semibold text-gray-500 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              id="sortOrder"
              value={formData.sortOrder}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
            />
          </div>

          {/* Featured Image */}
          <div className="md:col-span-2 border-t pt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Featured Image</label>
            <div className="flex items-center gap-4">
              {featuredImageUrl ? (
                <div className="relative w-36 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={featuredImageUrl}
                    alt="Featured Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-36 h-24 bg-gray-50 border border-dashed rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                  No image selected
                </div>
              )}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openMediaPicker}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <ImageIcon size={14} />
                  Select Image
                </button>
                {featuredImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedImageUrl("");
                      setFormData((prev) => ({ ...prev, featuredImageId: null }));
                    }}
                    className="block px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition border border-red-200"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/services")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Update Service"
                : "Create Service"}
          </button>
        </div>
      </form>

      {/* FAQs Panel for Active service pages */}
      {isEditMode && (
        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <HelpCircle size={18} className="text-blue-600" />
                Service FAQs
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure questions and answers displayed directly on this service page path.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingFaq(null);
                setFaqQuestion("");
                setFaqAnswer("");
                setFaqSortOrder(0);
                setFaqShowHide(true);
                setFaqSchemaMarkup(false);
                setShowFaqModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Plus size={14} />
              Add FAQ
            </button>
          </div>

          {faqsLoading ? (
            <div className="text-xs text-gray-400 text-center py-6">Loading service FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-6 border border-dashed rounded-lg bg-gray-50/50">
              No FAQs defined for this service page yet.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="border rounded-xl p-4 bg-white hover:shadow-sm transition flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{faq.question}</h4>
                    <p className="text-xs text-gray-600 mt-1">{faq.answer}</p>
                    <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-semibold uppercase">
                      <span>Order: {faq.sortOrder}</span>
                      <span>•</span>
                      <span>Visibility: {faq.showHide ? "Visible" : "Hidden"}</span>
                      <span>•</span>
                      <span>SEO Schema: {faq.schemaMarkup ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqQuestion(faq.question);
                        setFaqAnswer(faq.answer);
                        setFaqSortOrder(faq.sortOrder);
                        setFaqShowHide(faq.showHide);
                        setFaqSchemaMarkup(faq.schemaMarkup);
                        setShowFaqModal(true);
                      }}
                      className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold transition border border-yellow-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowMediaPicker(false)} />
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 z-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-base">Select Featured Image</h3>
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-900" onClick={() => setShowMediaPicker(false)}>
                Close
              </button>
            </div>

            {mediaLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading library media...</div>
            ) : mediaList.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No media found. Upload images to the Media Library page first.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-1">
                {mediaList.map((m) => (
                  <div key={m.id} className="border rounded-lg p-2 bg-gray-50/50 hover:shadow transition">
                    <div className="relative w-full h-24 rounded overflow-hidden">
                      <img
                        src={m.secureUrl || m.url}
                        alt={m.altText || m.fileName || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                        {m.fileName}
                      </span>
                      <button
                        onClick={() => attachImage(m)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700 transition"
                      >
                        Choose
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Edit/Create Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowFaqModal(false)} />
          <form onSubmit={handleSaveFaq} className="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-base">
                {editingFaq ? "Edit FAQ" : "Add Service FAQ"}
              </h3>
              <button
                type="button"
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                onClick={() => setShowFaqModal(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Answer</label>
                <textarea
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={faqSortOrder}
                    onChange={(e) => setFaqSortOrder(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faqShowHide}
                    onChange={(e) => setFaqShowHide(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  Show FAQ on page
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faqSchemaMarkup}
                    onChange={(e) => setFaqSchemaMarkup(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  Inject Schema Markup (JSON-LD)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                className="px-3.5 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                onClick={() => setShowFaqModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                Save FAQ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
