"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle, 
  HelpCircle, 
  Save, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react";
import MediaPickerModal from "@/components/media/MediaPickerModal";

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
  const [faqError, setFaqError] = useState(null);

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
      const res = await fetch(`/api/admin/faq`, {
        headers: {
          "x-site-id": siteId,
        },
      });
      const json = await res.json();
      if (res.ok) {
        const filtered = (json.faqs || []).filter(
          (f) => f.page === `/services/${service.id}`
        );
        setFaqs(filtered.sort((a, b) => a.sortOrder - b.sortOrder));
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
          "x-site-id": siteId,
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
  const openMediaPicker = () => setShowMediaPicker(true);

  const attachImage = (media) => {
    setFormData((prev) => ({ ...prev, featuredImageId: media.id }));
    setFeaturedImageUrl(media.secureUrl || media.url);
    setShowMediaPicker(false);
  };

  // FAQ CRUD helpers
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    setFaqError(null);

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
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to save FAQ");
      }

      setShowFaqModal(false);
      fetchFaqs();
    } catch (err) {
      setFaqError(err.message);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/admin/faq/${faqId}`, {
        method: "DELETE",
        headers: {
          "x-site-id": siteId,
        },
      });
      if (!res.ok) throw new Error("Failed to delete FAQ");
      fetchFaqs();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold shadow-xs animate-fade-in">
          <AlertCircle className="shrink-0 text-rose-500" size={16} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Core Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Attributes Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase mb-4 pb-2 border-b border-slate-100">
                Service Description
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Premium Consulting Pack"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter detailed description of what is included in this service..."
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* CTA Integration Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase mb-1">
                Call to Action Setup
              </h2>
              <p className="text-[10px] text-slate-400">Configure CTA redirection buttons linked directly to this service card.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ctaButtonText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  name="ctaButtonText"
                  id="ctaButtonText"
                  value={formData.ctaButtonText}
                  onChange={handleChange}
                  placeholder="e.g., Get Started"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="ctaButtonLink" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  CTA Button Path/Link
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="ctaButtonLink"
                    id="ctaButtonLink"
                    value={formData.ctaButtonLink}
                    onChange={handleChange}
                    placeholder="e.g., /contact"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/30 pl-3.5 pr-10 py-2.5 text-xs font-mono text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <ExternalLink size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="space-y-6">
          {/* Settings Console Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase mb-4 pb-2 border-b border-slate-100">
                Publishing Console
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Publish Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active (Published)</option>
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pricing Label
                </label>
                <input
                  type="text"
                  name="price"
                  id="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., $499 or Call for Quote"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="sortOrder" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Order Priority Weight
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  id="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Featured Image upload preview card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase mb-1">
                Featured Cover Image
              </h2>
              <p className="text-[10px] text-slate-400">Visual visual presentation card cover image.</p>
            </div>

            <div className="space-y-4">
              {featuredImageUrl ? (
                <div className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
                  <img
                    src={featuredImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={openMediaPicker}
                      className="px-3 py-1.5 bg-white text-slate-800 hover:bg-slate-50 rounded-lg text-[10px] font-bold shadow-sm transition"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeaturedImageUrl("");
                        setFormData((prev) => ({ ...prev, featuredImageId: null }));
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-[10px] font-bold shadow-sm transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openMediaPicker}
                  className="w-full aspect-video border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/5 rounded-xl flex flex-col items-center justify-center gap-2 text-center p-4 transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-3 bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-400 rounded-full transition">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Select Cover Cover Image</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">JPEG, PNG or WebP up to 5MB</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating action bar styling for form */}
        <div className="lg:col-span-3 flex justify-end items-center gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={() => router.push("/services")}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 active:bg-slate-100 transition-all duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Save size={14} />
                {isEditMode ? "Save Changes" : "Create Service"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* FAQs Panel for Active service pages */}
      {isEditMode && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                Service Frequently Asked Questions (FAQs)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure context-specific questions and answers mapped directly to the route: <code className="bg-slate-50 px-1.5 py-0.5 rounded font-mono text-slate-600">/services/{service.id}</code>
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
                setFaqError(null);
                setShowFaqModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition duration-200 self-start sm:self-auto"
            >
              <Plus size={14} />
              Add FAQ
            </button>
          </div>

          {faqsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Loading service FAQs...</span>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
              <HelpCircle className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-600">No FAQs mapped to this service yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Click the Add FAQ button above to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {faqs.map((faq) => (
                <div 
                  key={faq.id} 
                  className="group border border-slate-100 hover:border-slate-200 rounded-2xl p-5 bg-slate-50/20 hover:bg-white hover:shadow-xs transition duration-200 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Weight: {faq.sortOrder}
                      </span>
                      {faq.showHide ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">
                          <Eye size={10} />
                          Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold">
                          <EyeOff size={10} />
                          Hidden
                        </span>
                      )}
                      {faq.schemaMarkup && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          <Sparkles size={10} />
                          JSON-LD Schema Active
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{faq.question}</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end md:self-start opacity-90 md:opacity-0 group-hover:opacity-100 transition duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqQuestion(faq.question);
                        setFaqAnswer(faq.answer);
                        setFaqSortOrder(faq.sortOrder);
                        setFaqShowHide(faq.showHide);
                        setFaqSchemaMarkup(faq.schemaMarkup);
                        setFaqError(null);
                        setShowFaqModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold shadow-xs transition"
                    >
                      <Edit size={10} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold shadow-xs transition"
                    >
                      <Trash2 size={10} />
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
        <MediaPickerModal
          title="Select Featured Image"
          filter="images"
          onSelect={attachImage}
          onClose={() => setShowMediaPicker(false)}
          siteId={siteId}
        />
      )}

      {/* FAQ Edit/Create Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" 
            onClick={() => setShowFaqModal(false)} 
          />
          <form 
            onSubmit={handleSaveFaq} 
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 border border-slate-100 transform transition-all duration-300 scale-100 flex flex-col gap-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                {editingFaq ? "Modify FAQ" : "Add Service FAQ"}
              </h3>
              <button
                type="button"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowFaqModal(false)}
              >
                Cancel
              </button>
            </div>

            {faqError && (
              <div className="flex gap-2.5 p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs font-semibold">
                <AlertCircle className="shrink-0 text-rose-500" size={15} />
                <p>{faqError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Text</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g., What is included in this bundle?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Answer Text</label>
                <textarea
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Provide a clear, detailed answer..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Sort Weight</label>
                  <input
                    type="number"
                    value={faqSortOrder}
                    onChange={(e) => setFaqSortOrder(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex-1 flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Display FAQ</span>
                    <span className="text-[10px] text-slate-400">Make FAQ visible on page</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={faqShowHide}
                    onChange={(e) => setFaqShowHide(e.target.checked)}
                    className="rounded text-indigo-600 h-4.5 w-4.5 border-slate-300 focus:ring-indigo-500/20"
                  />
                </label>

                <label className="flex-1 flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Inject Schema</span>
                    <span className="text-[10px] text-slate-400">SEO Schema JSON-LD markup</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={faqSchemaMarkup}
                    onChange={(e) => setFaqSchemaMarkup(e.target.checked)}
                    className="rounded text-indigo-600 h-4.5 w-4.5 border-slate-300 focus:ring-indigo-500/20"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                onClick={() => setShowFaqModal(false)}
              >
                Discard
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10"
              >
                <Save size={12} />
                Save FAQ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

