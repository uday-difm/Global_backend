"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MediaPickerModal from "@/components/media/MediaPickerModal";

export default function PostEditor({ siteId, post, categories = [], authors = [] }) {
  const router = useRouter();
  const isEditMode = !!post;

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [authorId, setAuthorId] = useState("");
  
  // Categories states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCatName, setNewCatName] = useState("");
  const [catCreating, setCatCreating] = useState(false);

  // Scheduling states
  const [customPublishDate, setCustomPublishDate] = useState(false);
  const [publishDate, setPublishDate] = useState("");

  // Media Selector states
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [featuredImageId, setFeaturedImageId] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");

  // SEO states
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper: format ISO date to YYYY-MM-DDTHH:MM
  function formatForDateTimeLocal(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Helper to slugify text
  function slugify(text = "") {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  useEffect(() => {
    if (isEditMode && post) {
      setTitle(post.title || "");
      setSlug(post.slug || "");
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setStatus(post.status || "DRAFT");
      setAuthorId(post.authorId || "");
      
      // SEO
      setSeoTitle(post.seoTitle || "");
      setSeoDescription(post.seoDescription || "");

      // Categories
      if (post.categories) {
        setSelectedCategoryIds(post.categories.map((c) => c.id));
      }

      // Featured Image
      if (post.featuredImage) {
        setFeaturedImageId(post.featuredImage.id);
        setFeaturedImageUrl(post.featuredImage.secureUrl || post.featuredImage.url);
      } else if (post.featuredImageId) {
        setFeaturedImageId(post.featuredImageId);
      }

      // Scheduling
      if (post.publishedAt) {
        setCustomPublishDate(true);
        setPublishDate(formatForDateTimeLocal(post.publishedAt));
      }
    }
  }, [post, isEditMode]);

  // Handle title changes and auto-slugify if not edited manually
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditMode) {
      setSlug(slugify(val));
    }
  };

  // Inline Category Creator
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      // Add to list and select it
      setLocalCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategoryIds((prev) => [...prev, data.category.id]);
      setNewCatName("");
    } catch (err) {
      alert(err.message);
    } finally {
      setCatCreating(false);
    }
  };

  // Toggle category checkboxes
  const handleCategoryToggle = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Media Picker Dialog Functions
  const openMediaPicker = () => setShowMediaPicker(true);

  const selectFeaturedImage = (media) => {
    setFeaturedImageId(media.id);
    setFeaturedImageUrl(media.secureUrl || media.url);
    setShowMediaPicker(false);
  };

  const removeFeaturedImage = () => {
    setFeaturedImageId(null);
    setFeaturedImageUrl("");
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const postData = {
      siteId,
      title,
      slug,
      excerpt,
      content,
      status,
      authorId: authorId || null,
      featuredImageId: featuredImageId || null,
      categoryIds: selectedCategoryIds,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      publishedAt: customPublishDate && publishDate ? new Date(publishDate).toISOString() : null,
    };

    const url = isEditMode ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
    const method = isEditMode ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify(postData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save post");
      }

      router.push("/blogs");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
                Post Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter an engaging title..."
                className="mt-1.5 block w-full px-3 py-2 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-semibold text-slate-700">
                URL Slug
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="url-slug-here"
                className="mt-1.5 block w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-semibold text-slate-700">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a brief, compelling summary for SEO and lists..."
                rows={3}
                className="mt-1.5 block w-full px-3 py-2 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-slate-700">
                Content Body
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article markdown or plain text content here..."
                rows={14}
                className="mt-1.5 block w-full px-3 py-2 text-sm border border-slate-300 rounded-md shadow-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Meta Panels */}
        <div className="space-y-6">
          
          {/* Status & Publish options Card */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Publish Settings</h3>
            
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published / Scheduled</option>
              </select>
            </div>

            <div>
              <label htmlFor="authorId" className="block text-xs font-semibold text-slate-700">
                Author
              </label>
              <select
                id="authorId"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Logged-in User (Default)</option>
                {authors.map((auth) => (
                  <option key={auth.id} value={auth.id}>
                    {auth.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customPublishDate}
                  onChange={(e) => setCustomPublishDate(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 h-4 w-4"
                />
                Schedule / Custom Publish Date
              </label>
              
              {customPublishDate && (
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <p className="text-3xs text-slate-400 mt-1">
                    Setting a future date schedules the article.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push("/blogs")}
                className="flex-1 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm"
              >
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Publish"}
              </button>
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Featured Image</h3>
            
            {featuredImageUrl ? (
              <div className="space-y-2">
                <div className="relative group rounded-md overflow-hidden aspect-video border bg-slate-50">
                  <img
                    src={featuredImageUrl}
                    alt="Featured Image Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={openMediaPicker}
                      className="px-2.5 py-1 text-2xs bg-white text-slate-800 rounded font-semibold hover:bg-slate-100"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="w-full py-1 text-2xs border border-red-200 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openMediaPicker}
                className="w-full py-6 border-2 border-dashed border-slate-300 rounded-md text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs font-semibold">Select Featured Image</span>
              </button>
            )}
          </div>

          {/* Categories Card */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Categories</h3>
            
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 border rounded p-2.5 bg-slate-50">
              {localCategories.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No categories created yet.</p>
              ) : (
                localCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 h-4 w-4"
                    />
                    {cat.name}
                  </label>
                ))
              )}
            </div>

            {/* Quick Add Category inline */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={catCreating || !newCatName.trim()}
                  className="px-3 py-1 bg-slate-800 text-white hover:bg-slate-950 disabled:bg-slate-300 text-2xs font-semibold rounded transition-colors"
                >
                  {catCreating ? "..." : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* SEO Metadata Card */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">SEO Fields</h3>
            
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="seoTitle" className="block text-xs font-semibold text-slate-700">
                  Meta Title
                </label>
                <span className={`text-3xs ${seoTitle.length > 60 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {seoTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Google search listing title..."
                className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="seoDescription" className="block text-xs font-semibold text-slate-700">
                  Meta Description
                </label>
                <span className={`text-3xs ${seoDescription.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {seoDescription.length}/160
                </span>
              </div>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Google search preview description paragraph..."
                rows={3}
                className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

        </div>

      </form>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          title="Select Featured Image"
          filter="images"
          onSelect={selectFeaturedImage}
          onClose={() => setShowMediaPicker(false)}
          siteId={siteId}
        />
      )}
    </div>
  );
}
