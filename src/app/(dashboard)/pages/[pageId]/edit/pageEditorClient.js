// src/app/(dashboard)/pages/[pageId]/edit/pageEditorClient.js
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpCircle,
  FileText, 
  Settings, 
  Sliders, 
  Code, 
  Smartphone, 
  Monitor, 
  Save, 
  Image as ImageIcon,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// SafeImage helper to support Next.js Image caching or fallback <img>
function SafeImage({ src, alt, ...props }) {
  if (!src) return null;
  const isLocal = src.startsWith("/") || src.startsWith(".") || src.startsWith("..");
  const isCloudinary = src.includes("res.cloudinary.com");

  if (isLocal || isCloudinary) {
    return <Image src={src} alt={alt} {...props} />;
  }

  const { fill, style, ...rest } = props;
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          ...style,
        }}
        {...rest}
      />
    );
  }
  return <img src={src} alt={alt} style={style} {...rest} />;
}

export default function PageEditorClient({ pageId, siteId, pageTitle }) {
  // Safe fetch overlay injecting site token
  const fetchWithAuth = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "x-site-id": siteId,
      },
    });
  };

  // State Management
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [rawJsonContent, setRawJsonContent] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Page Settings Metadata States
  const [title, setTitle] = useState(pageTitle || "");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [jsonLd, setJsonLd] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Role management (only admins can toggle publish status)
  const [userRole, setUserRole] = useState("EDITOR");

  // Visual Form state variables (syncs with currently selected section)
  const [visualFields, setVisualFields] = useState({});

  // Media library picker states
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [pickerTargetField, setPickerTargetField] = useState(""); // "backgroundUrl" | "imageUrl"

  // Active workspace settings tab: "page_meta" | "section_visual" | "section_json" | "help"
  const [activeTab, setActiveTab] = useState("page_meta");

  // Live viewport preview toggle: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const flashMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Fetch page session user role limits
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => {
        if (json?.user?.globalRole) {
          setUserRole(json.user.globalRole);
        }
      })
      .catch((err) => console.error("Error fetching session role:", err));
  }, []);

  // Fetch page meta + sections list
  const fetchPageDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch metadata
      const metaRes = await fetchWithAuth(`/api/admin/pages/${pageId}`);
      if (metaRes.ok) {
        const json = await metaRes.json();
        if (json.page) {
          const p = json.page;
          setTitle(p.title || "");
          setSlug(p.slug || "");
          setSeoTitle(p.seoTitle || "");
          setSeoDescription(p.seoDescription || "");
          setStatus(p.status || "DRAFT");
          setJsonLd(p.jsonLd ? JSON.stringify(p.jsonLd, null, 2) : "");
          setCanonicalUrl(p.canonicalUrl || "");
          setOgImage(p.ogImage || "");
        }
      }

      // 2. Fetch sections list
      const sectionsRes = await fetchWithAuth(`/api/admin/pages/${pageId}/sections`);
      if (sectionsRes.ok) {
        const json = await sectionsRes.json();
        setSections(json.sections || []);
      }
    } catch (err) {
      console.error(err);
      flashMessage("Error loading page configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageDetails();
  }, [pageId]);

  // Synchronize visual form fields whenever a section is selected
  const handleSelectSection = (sec) => {
    setSelectedSection(sec);
    setRawJsonContent(JSON.stringify(sec.content || {}, null, 2));
    
    // Seed visual inputs based on type
    if (sec.type === "HERO") {
      setVisualFields({
        title: sec.content?.title || "",
        subtitle: sec.content?.subtitle || "",
        backgroundUrl: sec.content?.backgroundUrl || "",
        alignment: sec.content?.alignment || "center",
        primaryButtonText: sec.content?.primaryButton?.text || "",
        primaryButtonUrl: sec.content?.primaryButton?.url || "",
        secondaryButtonText: sec.content?.secondaryButton?.text || "",
        secondaryButtonUrl: sec.content?.secondaryButton?.url || "",
      });
    } else if (sec.type === "TEXT_BLOCK") {
      setVisualFields({
        title: sec.content?.title || "",
        body: sec.content?.body || "",
        imageUrl: sec.content?.imageUrl || "",
        imagePosition: sec.content?.imagePosition || "top",
        ctaText: sec.content?.cta?.text || "",
        ctaUrl: sec.content?.cta?.url || "",
      });
    } else {
      // General or custom section type visual settings
      setVisualFields(sec.content || {});
    }

    setActiveTab("section_visual");
  };

  // Add Section to Page
  const handleAddSection = async (type) => {
    setActionLoading(true);
    try {
      const defaultContent = {};
      if (type === "HERO") {
        defaultContent.title = "Welcome to Our Platform";
        defaultContent.subtitle = "Creating high-fidelity digital solutions that work.";
        defaultContent.alignment = "center";
      } else if (type === "TEXT_BLOCK") {
        defaultContent.title = "Our Story";
        defaultContent.body = "We build systems using clean principles, pure Javascript components, and high-performance databases.";
      }

      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: defaultContent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add section");

      setSections((prev) => [...prev, json.section]);
      handleSelectSection(json.section);
      flashMessage(`Added ${type} section`);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save changes to selected section
  const handleSaveSection = async (updatedContent = null) => {
    if (!selectedSection) return;
    setActionLoading(true);
    
    let contentToSave = updatedContent;
    if (!contentToSave) {
      if (activeTab === "section_json") {
        try {
          contentToSave = JSON.parse(rawJsonContent);
        } catch (e) {
          alert("Invalid raw JSON format. Please correct it before saving.");
          setActionLoading(false);
          return;
        }
      } else {
        // Build payload from Visual Form Fields
        if (selectedSection.type === "HERO") {
          contentToSave = {
            title: visualFields.title || "",
            subtitle: visualFields.subtitle || "",
            backgroundUrl: visualFields.backgroundUrl || "",
            alignment: visualFields.alignment || "center",
          };
          if (visualFields.primaryButtonText) {
            contentToSave.primaryButton = {
              text: visualFields.primaryButtonText,
              url: visualFields.primaryButtonUrl || "/",
            };
          }
          if (visualFields.secondaryButtonText) {
            contentToSave.secondaryButton = {
              text: visualFields.secondaryButtonText,
              url: visualFields.secondaryButtonUrl || "/",
            };
          }
        } else if (selectedSection.type === "TEXT_BLOCK") {
          contentToSave = {
            title: visualFields.title || "",
            body: visualFields.body || "",
            imageUrl: visualFields.imageUrl || "",
            imagePosition: visualFields.imagePosition || "top",
          };
          if (visualFields.ctaText) {
            contentToSave.cta = {
              text: visualFields.ctaText,
              url: visualFields.ctaUrl || "/",
            };
          }
        } else {
          contentToSave = visualFields;
        }
      }
    }

    try {
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections/${selectedSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSave }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save section");

      setSections((prev) => prev.map((s) => (s.id === json.section.id ? json.section : s)));
      setSelectedSection(json.section);
      flashMessage("Section content saved successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Section
  const handleDeleteSection = async (sec) => {
    if (!confirm("Are you sure you want to delete this section? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections/${sec.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete section");

      setSections((prev) => prev.filter((s) => s.id !== sec.id));
      if (selectedSection?.id === sec.id) {
        setSelectedSection(null);
        setActiveTab("page_meta");
      }
      flashMessage("Section deleted");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Hide or Show Section
  const handleToggleVisibility = async (sec) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections/${sec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !sec.isVisible }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error("Failed to change visibility");

      setSections((prev) => prev.map((s) => (s.id === json.section.id ? json.section : s)));
      if (selectedSection?.id === sec.id) {
        setSelectedSection(json.section);
      }
      flashMessage(json.section.isVisible ? "Section is now visible" : "Section is now hidden");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reordering controls
  const handleMoveSection = async (sec, direction) => {
    const currentIndex = sections.findIndex((s) => s.id === sec.id);
    if (currentIndex === -1) return;
    
    let targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    setActionLoading(true);
    try {
      // Re-map index sequences
      const rearranged = [...sections];
      const temp = rearranged[currentIndex];
      rearranged[currentIndex] = rearranged[targetIndex];
      rearranged[targetIndex] = temp;

      const orderedIds = rearranged.map((s) => s.id);
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Reordering failed on the server");

      setSections(rearranged.map((s, index) => ({ ...s, order: index })));
      flashMessage("Section order updated");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveToTop = async (sec) => {
    setActionLoading(true);
    try {
      const orderedIds = [sec.id, ...sections.filter((s) => s.id !== sec.id).map((s) => s.id)];
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Moving to top failed");

      // Refresh list to pull final DB order
      const sectionsRes = await fetchWithAuth(`/api/admin/pages/${pageId}/sections`);
      if (sectionsRes.ok) {
        const json = await sectionsRes.json();
        setSections(json.sections || []);
      }
      flashMessage("Moved to top");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Page Settings (Title, Slug, SEO details, JSON-LD, Status)
  const handleSavePageSettings = async (overrideStatus = null) => {
    setActionLoading(true);

    let parsedJsonLd = null;
    if (jsonLd && jsonLd.trim()) {
      try {
        parsedJsonLd = JSON.parse(jsonLd);
      } catch (e) {
        alert("Invalid JSON-LD. Please verify the JSON schema format.");
        setActionLoading(false);
        return;
      }
    }

    const payload = {
      title,
      slug,
      seoTitle,
      seoDescription,
      canonicalUrl,
      ogImage,
      jsonLd: parsedJsonLd,
    };

    if (overrideStatus) {
      payload.status = overrideStatus;
    }

    try {
      const res = await fetchWithAuth(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update page settings");
      }

      if (overrideStatus) {
        setStatus(overrideStatus);
        flashMessage(`Page status toggled to: ${overrideStatus}`);
      } else {
        flashMessage("Page settings saved");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async () => {
    const isAdmin = userRole === "SUPERADMIN" || userRole === "ADMIN";
    if (!isAdmin) {
      alert("Permission Denied: Only administrators can publish or draft pages.");
      return;
    }

    const nextStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await handleSavePageSettings(nextStatus);
  };

  // Media Library Attachment
  const handleOpenMediaPicker = (targetField) => {
    setPickerTargetField(targetField);
    setShowMediaPicker(true);
    if (mediaList.length > 0) return;

    setMediaLoading(true);
    fetchWithAuth(`/api/media`)
      .then((r) => r.json())
      .then((json) => {
        setMediaList(Array.isArray(json) ? json : json.media ? json.media : []);
      })
      .catch((err) => console.error("Error fetching media library:", err))
      .finally(() => setMediaLoading(false));
  };

  const handleSelectMedia = (media) => {
    const url = media.secureUrl || media.url;
    if (pickerTargetField === "ogImage") {
      setOgImage(url);
    } else {
      setVisualFields((prev) => ({
        ...prev,
        [pickerTargetField]: url,
      }));
    }
    setShowMediaPicker(false);
  };

  return (
    <div className="space-y-6">
      {/* Save indicator / Flash alerts */}
      {message && (
        <div className="fixed top-4 right-4 z-50 flex gap-2.5 p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold shadow-md animate-in fade-in duration-200">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      {/* Editor top action strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 bg-slate-900 text-white p-4 rounded-xl shadow">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="text-indigo-400" size={18} />
            Page Builder Client Workspace
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Page Title: <span className="text-white font-semibold">{title}</span> &bull; Slug: <span className="font-mono text-indigo-300">{slug || "/"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center text-xs font-bold">
          <select
            onChange={(e) => handleAddSection(e.target.value)}
            defaultValue=""
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>+ Add Section Component</option>
            <option value="HERO">Hero Section Banner</option>
            <option value="TEXT_BLOCK">Rich Text Block Area</option>
            <option value="SERVICES">Services Feature Listing</option>
            <option value="TEAM">Corporate Team Section</option>
            <option value="TESTIMONIALS">Customer Testimonials List</option>
            <option value="FAQ">Frequently Asked Questions</option>
            <option value="CTA">Call-To-Action Button Row</option>
          </select>

          <button
            type="button"
            onClick={() => handleSavePageSettings()}
            disabled={actionLoading}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
          >
            <Save size={14} />
            Save Meta
          </button>

          {/* Draft/Publish Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={actionLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg shadow transition ${
              status === "PUBLISHED"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            <CheckCircle size={14} />
            {status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
          </button>

          <button
            type="button"
            onClick={() => {
              const url = `/preview?pageId=${encodeURIComponent(pageId)}&siteId=${encodeURIComponent(siteId)}`;
              window.open(url, "_blank");
            }}
            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg transition"
          >
            Open Live Preview
          </button>
        </div>
      </div>

      {/* Editor Split Grid Pane */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Layout Sections Tree */}
        <div className="xl:col-span-1 bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
            <Sliders size={14} className="text-indigo-600" />
            Page Section Tree ({sections.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading elements...</div>
          ) : sections.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-450 border-2 border-dashed rounded-xl space-y-2">
              <p>No section blocks present.</p>
              <p className="text-[10px]">Select a type from the top dropdown to start building.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {sections.map((sec) => (
                <div 
                  key={sec.id}
                  onClick={() => handleSelectSection(sec)}
                  className={`border p-3.5 rounded-lg cursor-pointer transition flex flex-col gap-2 hover:shadow-sm ${
                    selectedSection?.id === sec.id
                      ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                      : "border-gray-250 hover:border-gray-400 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold tracking-wider">
                      {sec.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">#{sec.id.slice(0, 6)}</span>
                  </div>

                  {/* Section text summary snippet */}
                  <p className="text-[11px] text-gray-500 truncate font-semibold">
                    {sec.content?.title || sec.content?.body || "— (No text contents)"}
                  </p>

                  {/* Action row */}
                  <div className="flex items-center justify-between border-t pt-2 mt-1 gap-1 text-gray-500">
                    <div className="flex items-center gap-1">
                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(sec);
                        }}
                        className={`p-1 rounded hover:bg-gray-100 ${sec.isVisible ? "text-indigo-600" : "text-gray-400"}`}
                        title={sec.isVisible ? "Hide section" : "Show section"}
                      >
                        {sec.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(sec);
                        }}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                        title="Delete section"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={sec.order === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(sec, "up");
                        }}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(sec, "down");
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToTop(sec);
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-indigo-600"
                        title="Bring to Top"
                      >
                        <ArrowUpCircle size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tabbed Section Content Editing Panel */}
        <div className="xl:col-span-3 bg-white border rounded-xl p-5 shadow-sm space-y-5">
          {/* Sub-tab Selection */}
          <div className="flex bg-gray-50 border rounded-lg p-1 text-xs font-bold text-gray-500">
            <button
              onClick={() => setActiveTab("page_meta")}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "page_meta"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <Settings size={14} />
              Page Details & SEO
            </button>
            
            <button
              onClick={() => {
                if (!selectedSection) return alert("Select a section from the tree first.");
                setActiveTab("section_visual");
              }}
              disabled={!selectedSection}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                !selectedSection ? "opacity-40 cursor-not-allowed" : ""
              } ${
                activeTab === "section_visual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <Sliders size={14} />
              Visual Editor
            </button>

            <button
              onClick={() => {
                if (!selectedSection) return alert("Select a section from the tree first.");
                setActiveTab("section_json");
              }}
              disabled={!selectedSection}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                !selectedSection ? "opacity-40 cursor-not-allowed" : ""
              } ${
                activeTab === "section_json"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <Code size={14} />
              Source JSON
            </button>

            <button
              onClick={() => setActiveTab("help")}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "help"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <HelpCircle size={14} />
              Editor Guide
            </button>
          </div>

          {/* TAB 1: Page details settings */}
          {activeTab === "page_meta" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Page Metadata & Configurations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Page Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Route Slug Path</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Search results title header"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SEO Description</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Short description snippet of page contents for google indexing"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="e.g. https://yourdomain.com/about"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">OG Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder="e.g. https://yourdomain.com/og.jpg"
                      className="flex-1 rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker("ogImage")}
                      className="px-3.5 py-2 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-650 transition flex items-center gap-1"
                    >
                      <ImageIcon size={12} />
                      Library
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">JSON-LD Structured Data Schema</label>
                <textarea
                  value={jsonLd}
                  onChange={(e) => setJsonLd(e.target.value)}
                  placeholder='{ "@context": "https://schema.org", "@type": "WebPage", ... }'
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600 h-32"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSavePageSettings()}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <Save size={12} />
                  Save Metadata Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Visual Content Form Editor */}
          {activeTab === "section_visual" && selectedSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Visual Editor &bull; {selectedSection.type} Template
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">ID: {selectedSection.id}</span>
              </div>

              {/* Conditionally render form fields based on Section Type */}
              {selectedSection.type === "HERO" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hero Title</label>
                      <input
                        type="text"
                        value={visualFields.title || ""}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hero Subtitle</label>
                      <input
                        type="text"
                        value={visualFields.subtitle || ""}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Banner Background Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={visualFields.backgroundUrl || ""}
                          onChange={(e) => setVisualFields(prev => ({ ...prev, backgroundUrl: e.target.value }))}
                          className="flex-1 rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenMediaPicker("backgroundUrl")}
                          className="px-3.5 py-2 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-650 transition flex items-center gap-1"
                        >
                          <ImageIcon size={12} />
                          Library
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Content Alignment</label>
                      <select
                        value={visualFields.alignment || "center"}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, alignment: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                      >
                        <option value="left">Align Content Left</option>
                        <option value="center">Align Content Centered</option>
                        <option value="right">Align Content Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">CTA Buttons Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Button */}
                      <div className="border p-3.5 rounded-lg space-y-3 bg-gray-50/20">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Primary Call-To-Action</span>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Label Text</label>
                          <input
                            type="text"
                            value={visualFields.primaryButtonText || ""}
                            onChange={(e) => setVisualFields(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                            className="w-full rounded border p-2 text-xs font-semibold"
                            placeholder="e.g. Subscribe"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Redirect Link Path</label>
                          <input
                            type="text"
                            value={visualFields.primaryButtonUrl || ""}
                            onChange={(e) => setVisualFields(prev => ({ ...prev, primaryButtonUrl: e.target.value }))}
                            className="w-full rounded border p-2 text-xs font-mono"
                            placeholder="e.g. /subscribe"
                          />
                        </div>
                      </div>

                      {/* Secondary Button */}
                      <div className="border p-3.5 rounded-lg space-y-3 bg-gray-50/20">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Secondary Call-To-Action</span>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Label Text</label>
                          <input
                            type="text"
                            value={visualFields.secondaryButtonText || ""}
                            onChange={(e) => setVisualFields(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                            className="w-full rounded border p-2 text-xs font-semibold"
                            placeholder="e.g. Learn More"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Redirect Link Path</label>
                          <input
                            type="text"
                            value={visualFields.secondaryButtonUrl || ""}
                            onChange={(e) => setVisualFields(prev => ({ ...prev, secondaryButtonUrl: e.target.value }))}
                            className="w-full rounded border p-2 text-xs font-mono"
                            placeholder="e.g. /about"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection.type === "TEXT_BLOCK" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Title Heading</label>
                      <input
                        type="text"
                        value={visualFields.title || ""}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 font-semibold"
                        placeholder="e.g. Overview"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Image Positioning</label>
                      <select
                        value={visualFields.imagePosition || "top"}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, imagePosition: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                      >
                        <option value="top">Image Stacked on Top</option>
                        <option value="left">Image Positioned Left</option>
                        <option value="right">Image Positioned Right</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Body Text Content</label>
                    <textarea
                      value={visualFields.body || ""}
                      onChange={(e) => setVisualFields(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 h-32"
                      placeholder="Write markdown or paragraph content here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Block Media Attachment URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={visualFields.imageUrl || ""}
                          onChange={(e) => setVisualFields(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="flex-1 rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenMediaPicker("imageUrl")}
                          className="px-3.5 py-2 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-650 transition flex items-center gap-1"
                        >
                          <ImageIcon size={12} />
                          Library
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CTA Label</label>
                        <input
                          type="text"
                          value={visualFields.ctaText || ""}
                          onChange={(e) => setVisualFields(prev => ({ ...prev, ctaText: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 p-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                          placeholder="Read More"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CTA URL</label>
                        <input
                          type="text"
                          value={visualFields.ctaUrl || ""}
                          onChange={(e) => setVisualFields(prev => ({ ...prev, ctaUrl: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 p-2.5 text-xs font-mono outline-none focus:border-indigo-600"
                          placeholder="/details"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Render custom configuration form for placeholder items like FAQ, services, etc. */}
              {selectedSection.type !== "HERO" && selectedSection.type !== "TEXT_BLOCK" && (
                <div className="space-y-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed border p-3 rounded-lg bg-gray-50">
                    💡 This section type is rendered dynamically. Customize its header title and styling configuration parameters below.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Header Title</label>
                      <input
                        type="text"
                        value={visualFields.title || ""}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600 font-semibold"
                        placeholder="Section Title"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description / Subtitle</label>
                      <input
                        type="text"
                        value={visualFields.description || ""}
                        onChange={(e) => setVisualFields(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-600"
                        placeholder="Subheading explanation"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection()}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <Save size={12} />
                  {actionLoading ? "Saving..." : "Save Section Content"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Source JSON Editor */}
          {activeTab === "section_json" && selectedSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Raw JSON content payload
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">#{selectedSection.id}</span>
              </div>

              <div>
                <textarea
                  value={rawJsonContent}
                  onChange={(e) => setRawJsonContent(e.target.value)}
                  className="w-full h-64 rounded-lg border border-gray-200 p-3 text-xs font-mono outline-none focus:border-indigo-600 bg-slate-900 text-slate-100"
                />
                <p className="text-[10px] text-gray-400 mt-1">Directly modify the JSON attributes of this section. Ensure syntax remains valid.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection()}
                  disabled={actionLoading}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <Save size={12} />
                  {actionLoading ? "Saving..." : "Save Raw Source"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Help Guide */}
          {activeTab === "help" && (
            <div className="space-y-4 text-xs text-gray-600 leading-relaxed max-w-2xl">
              <h3 className="font-bold text-gray-900 text-sm border-b pb-2">Section Layout Guide</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">🚀 Hero Section Banner</h4>
                  <p className="mt-0.5">Used at the very top of pages. Focuses on high-contrast headings, CTA redirects, background banner images, and text alignments.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">📝 Rich Text Block</h4>
                  <p className="mt-0.5">Flexible block used to explain services or publish content. Supports side-by-side images (placed on top, left, or right), titles, paragraphs, and links.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">📦 Modules (FAQ, Services, Team, Testimonials)</h4>
                  <p className="mt-0.5">Dynamically pulls records from their respective admin dashboards. E.g. placing an FAQ section automatically fetches and structures all active FAQs for this page in schema markup.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Device Viewport container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 select-none">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor size={14} className="text-indigo-400" />
            Live Preview Simulator
          </span>

          <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded transition flex items-center gap-1 ${
                previewDevice === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor size={12} />
              Desktop View
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded transition flex items-center gap-1 ${
                previewDevice === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone size={12} />
              Mobile View
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="w-full flex justify-center py-4 bg-slate-900/40 rounded-xl">
          <div className={`bg-white text-black transition-all duration-300 shadow-lg min-h-[400px] overflow-hidden flex flex-col ${
            previewDevice === "mobile"
              ? "w-full max-w-[380px] border border-slate-700 rounded-2xl ring-4 ring-slate-800"
              : "w-full border rounded-xl"
          }`}>
            
            {/* Header simulated bar */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between text-[10px] font-bold text-gray-500">
              <span className="text-slate-800 uppercase tracking-tight">{title || "MySite"}</span>
              <ul className="flex gap-3 uppercase text-[8px] tracking-wide text-gray-400">
                <li className="text-indigo-600">Home</li>
                <li>Details</li>
                <li>Contact</li>
              </ul>
            </div>

            {/* Sections Content List Simulator Render */}
            <div className="flex-1 bg-slate-50 flex flex-col">
              {sections.filter((s) => s.isVisible).map((sec) => {
                
                // HERO Render
                if (sec.type === "HERO") {
                  const aligns = {
                    left: "text-left items-start",
                    right: "text-right items-end",
                    center: "text-center items-center",
                  };
                  const alignmentClass = aligns[sec.content?.alignment || "center"];

                  // Live binding if selected to show typing instantly
                  const isCurrent = selectedSection?.id === sec.id;
                  const displayTitle = isCurrent ? visualFields.title : sec.content?.title;
                  const displaySubtitle = isCurrent ? visualFields.subtitle : sec.content?.subtitle;
                  const displayBgUrl = isCurrent ? visualFields.backgroundUrl : sec.content?.backgroundUrl;
                  const displayAlignment = isCurrent ? visualFields.alignment : sec.content?.alignment;
                  const alignmentClassLive = aligns[displayAlignment || "center"];

                  return (
                    <div 
                      key={sec.id}
                      style={{
                        backgroundImage: displayBgUrl ? `url(${displayBgUrl})` : "none",
                        backgroundPosition: "center",
                        backgroundSize: "cover"
                      }}
                      className={`relative min-h-[220px] px-6 py-10 flex flex-col justify-center border-b ${
                        displayBgUrl ? "text-white" : "bg-gradient-to-r from-slate-900 to-indigo-950 text-white"
                      } ${selectedSection?.id === sec.id ? "ring-2 ring-indigo-500" : ""}`}
                    >
                      {/* Dark overlay for text readability */}
                      {displayBgUrl && <div className="absolute inset-0 bg-slate-950/60 z-0" />}

                      <div className={`relative z-10 flex flex-col gap-2 ${alignmentClassLive}`}>
                        <h1 className="text-lg font-bold leading-tight md:text-xl max-w-md">
                          {displayTitle || "Hero Title Header"}
                        </h1>
                        <p className="text-[10px] text-slate-300 max-w-sm">
                          {displaySubtitle || "This is a placeholder subtitle for the page banner."}
                        </p>
                        
                        <div className="flex gap-2 mt-2">
                          <span className="px-3.5 py-1.5 bg-indigo-600 text-white rounded text-[8px] font-bold shadow">
                            {sec.content?.primaryButton?.text || "Action Button"}
                          </span>
                          {sec.content?.secondaryButton?.text && (
                            <span className="px-3.5 py-1.5 bg-white/20 border border-white/20 text-white rounded text-[8px] font-bold">
                              {sec.content.secondaryButton.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // TEXT BLOCK Render
                if (sec.type === "TEXT_BLOCK") {
                  const isCurrent = selectedSection?.id === sec.id;
                  const displayTitle = isCurrent ? visualFields.title : sec.content?.title;
                  const displayBody = isCurrent ? visualFields.body : sec.content?.body;
                  const displayImageUrl = isCurrent ? visualFields.imageUrl : sec.content?.imageUrl;
                  const displayPosition = isCurrent ? visualFields.imagePosition : sec.content?.imagePosition;

                  const isLeft = displayPosition === "left";
                  const isRight = displayPosition === "right";

                  return (
                    <div 
                      key={sec.id}
                      className={`bg-white px-6 py-8 border-b flex flex-col gap-4 text-xs font-medium text-slate-650 ${
                        selectedSection?.id === sec.id ? "ring-2 ring-indigo-500" : ""
                      } ${
                        (isLeft || isRight) && previewDevice === "desktop" ? "flex-row items-center" : "flex-col"
                      }`}
                    >
                      {displayImageUrl && (isLeft || displayPosition === "top") && (
                        <div className="shrink-0 w-full md:w-32 h-24 relative rounded overflow-hidden border">
                          <SafeImage 
                            src={displayImageUrl}
                            alt="Mock Section Image"
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="200px"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <h2 className="font-bold text-slate-900 text-sm">
                          {displayTitle || "Overview Section"}
                        </h2>
                        <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-line">
                          {displayBody || "Insert descriptive text blocks here to publish articles, content pages, or services information."}
                        </p>
                        {sec.content?.cta?.text && (
                          <span className="inline-block mt-2 font-bold text-indigo-600 border-b border-indigo-600 hover:text-indigo-700 text-[9px] uppercase tracking-wide">
                            {sec.content.cta.text} &rarr;
                          </span>
                        )}
                      </div>

                      {displayImageUrl && isRight && (
                        <div className="shrink-0 w-full md:w-32 h-24 relative rounded overflow-hidden border">
                          <SafeImage 
                            src={displayImageUrl}
                            alt="Mock Section Image"
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="200px"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                // Generic placeholder for other module sections (FAQ, Services, Testimonials, Team, CTA)
                return (
                  <div 
                    key={sec.id} 
                    className={`px-6 py-6 border-b bg-gray-50 flex items-center justify-between gap-4 ${
                      selectedSection?.id === sec.id ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {sec.type} Component
                      </span>
                      <h4 className="font-bold text-gray-800 text-xs">
                        {sec.content?.title || `${sec.type} List`}
                      </h4>
                      <p className="text-[9px] text-gray-400">
                        {sec.content?.description || `Pulls and renders active ${sec.type.toLowerCase()} logs from the database.`}
                      </p>
                    </div>

                    <div className="shrink-0 border-2 border-dashed border-gray-300 p-2 rounded text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-white">
                      Dynamic Content Box
                    </div>
                  </div>
                );
              })}

              {sections.filter((s) => s.isVisible).length === 0 && (
                <div className="flex-1 py-16 text-center text-[10px] text-gray-400 font-semibold bg-white flex flex-col justify-center items-center gap-1">
                  <Sliders size={20} className="text-gray-300 animate-pulse" />
                  No visible sections on this page.
                </div>
              )}
            </div>

            {/* Footer bar */}
            <div className="bg-slate-900 py-3 text-center text-[8px] text-slate-500 font-bold uppercase tracking-wider">
              &copy; {new Date().getFullYear()} {title || "CMS Site"} &bull; Generated structured layout
            </div>
          </div>
        </div>
      </div>

      {/* Media Pick overlay modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 md:pt-20">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowMediaPicker(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border w-full max-w-4xl p-6 z-10 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Media Asset</h3>
              <button
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                onClick={() => setShowMediaPicker(false)}
              >
                <X size={16} />
              </button>
            </div>

            {mediaLoading ? (
              <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2 flex-1">
                <RefreshCw size={24} className="animate-spin text-gray-300" />
                Loading media assets...
              </div>
            ) : mediaList.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-450 border border-dashed rounded-xl flex-1">
                No media assets found. Upload images to the Media Library first.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto pr-1 flex-1 pb-4">
                {mediaList.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => handleSelectMedia(m)}
                    className="border rounded-xl p-2.5 bg-gray-50/20 hover:border-indigo-500 hover:shadow-sm cursor-pointer transition flex flex-col gap-2 group"
                  >
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                      <SafeImage
                        src={m.secureUrl || m.url}
                        alt={m.altText || m.fileName || ""}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="200px"
                      />
                    </div>
                    <div className="text-[10px] text-gray-600 truncate font-semibold">
                      {m.originalName || m.fileName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
                onClick={() => setShowMediaPicker(false)}
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
