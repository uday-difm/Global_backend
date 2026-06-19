"use client";

import { useState } from "react";
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Layout,
  Search,
  Activity,
  Bot,
  Code,
  Image as ImageIcon,
  Globe,
  FileText,
  Sparkles,
  X,
  HelpCircle,
} from "lucide-react";
import MediaPickerModal from "@/components/media/MediaPickerModal";

export default function SettingsEditor({ siteId, initialSettings }) {
  const [activeTab, setActiveTab] = useState("brand");
  
  // Settings States
  const [websiteSettings, setWebsiteSettings] = useState(initialSettings?.websiteSettings || {});
  const [analytics, setAnalytics] = useState(initialSettings?.analytics || {});
  const [scripts, setScripts] = useState(initialSettings?.scripts || {});
  
  // UI Loading/Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Media Picker Trigger State
  const [activePickerField, setActivePickerField] = useState(null); // "logo", "favicon", "ogImage"

  const handleWebsiteChange = (e) => {
    const { name, value } = e.target;
    setWebsiteSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnalyticsChange = (e) => {
    const { name, value } = e.target;
    setAnalytics((prev) => ({ ...prev, [name]: value }));
  };

  const handleScriptsChange = (e) => {
    const { name, value } = e.target;
    setScripts((prev) => ({ ...prev, [name]: value }));
  };

  // Media Picker Callback
  const handleMediaSelect = (media) => {
    if (activePickerField === "logo") {
      setWebsiteSettings((prev) => ({ ...prev, logoUrl: media.url }));
    } else if (activePickerField === "favicon") {
      setWebsiteSettings((prev) => ({ ...prev, favicon: media.url }));
    } else if (activePickerField === "ogImage") {
      setWebsiteSettings((prev) => ({ ...prev, ogImageUrl: media.url }));
    }
    setActivePickerField(null);
  };

  // Submit Settings Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const settingsData = {
      siteId,
      analytics,
      scripts,
    };

    try {
      // Parallel Save Operations
      const [resGlobal, resWebsite] = await Promise.all([
        fetch("/api/admin/global-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsData),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-site-id": siteId,
          },
          body: JSON.stringify(websiteSettings),
        }),
      ]);

      if (!resGlobal.ok) {
        const errorData = await resGlobal.json();
        throw new Error(errorData.error || "Failed to save tracking/script settings");
      }
      if (!resWebsite.ok) {
        const errorData = await resWebsite.json();
        throw new Error(errorData.error || "Failed to save website/SEO settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Alert */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error updating settings</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-md flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="font-semibold">Settings Saved</p>
            <p className="text-sm">Global website settings updated successfully!</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("brand")}
            className={`px-5 py-4 text-center font-medium text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "brand"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
            }`}
          >
            <Layout className="w-4 h-4" />
            Brand & Identity
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`px-5 py-4 text-center font-medium text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "seo"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
            }`}
          >
            <Search className="w-4 h-4" />
            SEO Defaults
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-5 py-4 text-center font-medium text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "analytics"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
            }`}
          >
            <Activity className="w-4 h-4" />
            Analytics & Tracking
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("robots")}
            className={`px-5 py-4 text-center font-medium text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "robots"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
            }`}
          >
            <Bot className="w-4 h-4" />
            Robots & AI Agents
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scripts")}
            className={`px-5 py-4 text-center font-medium text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "scripts"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
            }`}
          >
            <Code className="w-4 h-4" />
            Custom Scripts
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          
          {/* Tab 1: Brand & Identity */}
          {activeTab === "brand" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Brand Information & Assets</h3>
                <p className="text-xs text-gray-500 mt-1">Configure your canonical site domain, logos, and favicons.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="domain" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    Site Domain (Canonical Base URL)
                  </label>
                  <input
                    type="url"
                    id="domain"
                    name="domain"
                    value={websiteSettings.domain || ""}
                    onChange={handleWebsiteChange}
                    placeholder="e.g. https://yourcompany.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Used to generate correct Sitemap URLs, Canonical tags, and absolute links in RSS feeds.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Primary Brand Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      name="primaryColor"
                      value={websiteSettings.primaryColor || "#3b82f6"}
                      onChange={handleWebsiteChange}
                      className="w-11 h-11 p-0.5 bg-white border border-gray-200 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={websiteSettings.primaryColor || "#3b82f6"}
                      onChange={handleWebsiteChange}
                      placeholder="#3b82f6"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Logo & Favicon Picker Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                {/* Logo Select */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Website Logo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="logoUrl"
                      value={websiteSettings.logoUrl || ""}
                      onChange={handleWebsiteChange}
                      placeholder="/logo.png or Cloudinary URL"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setActivePickerField("logo")}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Browse
                    </button>
                  </div>
                  {websiteSettings.logoUrl && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center gap-3">
                      <img
                        src={websiteSettings.logoUrl}
                        alt="Brand Logo Preview"
                        className="max-h-8 max-w-[120px] object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-[160px]">{websiteSettings.logoUrl}</span>
                    </div>
                  )}
                </div>

                {/* Favicon Select */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Website Favicon URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="favicon"
                      value={websiteSettings.favicon || ""}
                      onChange={handleWebsiteChange}
                      placeholder="/favicon.ico or Cloudinary URL"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setActivePickerField("favicon")}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Browse
                    </button>
                  </div>
                  {websiteSettings.favicon && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center gap-3">
                      <img
                        src={websiteSettings.favicon}
                        alt="Favicon Preview"
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-[160px]">{websiteSettings.favicon}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: SEO Defaults */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Global SEO Configurations</h3>
                <p className="text-xs text-gray-500 mt-1">Define default values applied when pages or posts lack specific metadata overrides.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="seo_title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Default SEO Title
                  </label>
                  <input
                    type="text"
                    id="seo_title"
                    name="title"
                    value={websiteSettings.title || ""}
                    onChange={handleWebsiteChange}
                    placeholder="e.g. Acme Corporation | Home"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="seo_titleTemplate" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Title Template
                    <span className="normal-case text-[10px] text-gray-400 font-normal">Use %s for dynamic page title</span>
                  </label>
                  <input
                    type="text"
                    id="seo_titleTemplate"
                    name="titleTemplate"
                    value={websiteSettings.titleTemplate || ""}
                    onChange={handleWebsiteChange}
                    placeholder="e.g. %s | Acme Corporation"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="seo_description" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Default Meta Description
                </label>
                <textarea
                  id="seo_description"
                  name="description"
                  value={websiteSettings.description || ""}
                  onChange={handleWebsiteChange}
                  rows={3}
                  placeholder="Provide a general description of your website for search engines..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Default OG Image */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  Default Open Graph (OG) Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="ogImageUrl"
                    value={websiteSettings.ogImageUrl || ""}
                    onChange={handleWebsiteChange}
                    placeholder="https://yourdomain.com/og-image.jpg"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setActivePickerField("ogImage")}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Browse
                  </button>
                </div>
                {websiteSettings.ogImageUrl && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center gap-3">
                    <img
                      src={websiteSettings.ogImageUrl}
                      alt="OG Image Preview"
                      className="max-h-16 max-w-[160px] object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[160px]">{websiteSettings.ogImageUrl}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 3: Analytics & Tracking */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Analytics & Tracking Codes</h3>
                <p className="text-xs text-gray-500 mt-1">Configure measurement keys for user action and session tracking engines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="googleAnalyticsId" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    name="googleAnalyticsId"
                    id="googleAnalyticsId"
                    value={analytics.googleAnalyticsId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label htmlFor="clarityId" className="block text-sm font-medium text-gray-700 mb-2">
                    Microsoft Clarity ID
                  </label>
                  <input
                    type="text"
                    name="clarityId"
                    id="clarityId"
                    value={analytics.clarityId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label htmlFor="googleTagManagerId" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Tag Manager ID
                  </label>
                  <input
                    type="text"
                    name="googleTagManagerId"
                    id="googleTagManagerId"
                    value={analytics.googleTagManagerId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="GTM-XXXXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="searchConsoleId" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Search Console ID / Verification Code
                  </label>
                  <input
                    type="text"
                    name="searchConsoleId"
                    id="searchConsoleId"
                    value={analytics.searchConsoleId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="e.g. google1234567890abcdef"
                  />
                </div>

                <div>
                  <label htmlFor="metaPixelId" className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    name="metaPixelId"
                    id="metaPixelId"
                    value={analytics.metaPixelId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="e.g. 123456789012345"
                  />
                </div>

                <div>
                  <label htmlFor="linkedInTagId" className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Partner Insight ID
                  </label>
                  <input
                    type="text"
                    name="linkedInTagId"
                    id="linkedInTagId"
                    value={analytics.linkedInTagId || ""}
                    onChange={handleAnalyticsChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder="e.g. 1234567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Robots & AI Agents */}
          {activeTab === "robots" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Robots, Sitemaps & AI Scrapers</h3>
                  <p className="text-xs text-gray-500 mt-1">Edit crawler guidelines, scrapers exclusions, and AI-agent context instructions.</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/sitemap?siteId=${siteId}`}
                    target="_blank"
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 flex items-center gap-1 transition-colors"
                  >
                    Sitemap XML
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                  <a
                    href={`/api/seo/robots?siteId=${siteId}`}
                    target="_blank"
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 flex items-center gap-1 transition-colors"
                  >
                    Robots.txt
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                  <a
                    href={`/api/seo/llm-txt?siteId=${siteId}`}
                    target="_blank"
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 flex items-center gap-1 transition-colors"
                  >
                    LLM.txt
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div>
                <label htmlFor="robotsTxt" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Custom Robots.txt Content
                </label>
                <textarea
                  id="robotsTxt"
                  name="robotsTxt"
                  value={websiteSettings.robotsTxt || ""}
                  onChange={handleWebsiteChange}
                  rows={6}
                  placeholder={`User-agent: *\nAllow: /\nDisallow: /api/`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Overwrites standard robot directives. Leave blank to generate default crawler permissions.
                </p>
              </div>

              <div>
                <label htmlFor="llmTxt" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Custom LLM.txt Agent Guide
                </label>
                <textarea
                  id="llmTxt"
                  name="llmTxt"
                  value={websiteSettings.llmTxt || ""}
                  onChange={handleWebsiteChange}
                  rows={6}
                  placeholder={`# AI Agent System Guide\n\nThis site hosts company resources indexable by agents.`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Overwrites auto-generated LLM instructions. Leave blank to dynamically guide agents using services and posts index lists.
                </p>
              </div>

            </div>
          )}

          {/* Tab 5: Custom Scripts */}
          {activeTab === "scripts" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Custom Header & Body Scripts</h3>
                <p className="text-xs text-gray-500 mt-1">Inject custom script snippets (meta verifications, chat triggers, fonts) globally.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="headScripts" className="block text-sm font-medium text-gray-700 mb-2">
                    Scripts for &lt;head&gt;
                  </label>
                  <textarea
                    name="head"
                    id="headScripts"
                    value={scripts.head || ""}
                    onChange={handleScriptsChange}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder={`<script>... head injection ...</script>`}
                  />
                </div>
                
                <div>
                  <label htmlFor="bodyScripts" className="block text-sm font-medium text-gray-700 mb-2">
                    Scripts for start of &lt;body&gt;
                  </label>
                  <textarea
                    name="body"
                    id="bodyScripts"
                    value={scripts.body || ""}
                    onChange={handleScriptsChange}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    placeholder={`<!-- body open snippet injection -->`}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Submit Bar */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400 font-medium">
            Be careful updating script tags and robots rules in production.
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </div>

      {/* Media Picker Modal */}
      {activePickerField !== null && (
        <MediaPickerModal
          title={
            activePickerField === "logo"
              ? "Select Brand Logo"
              : activePickerField === "favicon"
              ? "Select Website Favicon"
              : "Select Default OG Image"
          }
          filter="images"
          onSelect={handleMediaSelect}
          onClose={() => setActivePickerField(null)}
          siteId={siteId}
        />
      )}
    </form>
  );
}

// Simple internal helper icon to avoid extra lucide-react import variations
function ExternalLinkIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}
