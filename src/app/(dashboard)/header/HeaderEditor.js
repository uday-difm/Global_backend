"use client";

import { useState } from "react";
import { Save, AlertCircle, CheckCircle2, Layout, Smartphone } from "lucide-react";

export default function HeaderEditor({ siteId, initialConfig }) {
  const defaultConfig = {
    layout: "logo-left",
    logoUrl: "/next.svg",
    logoWidth: 120,
    logoHeight: 24,
    menuType: "main",
    sticky: true,
    transparent: false,
    ctaText: "Get Started",
    ctaLink: "/contact",
    announcementBar: {
      enabled: true,
      text: "⚡ Welcome to our new headless multi-site CMS console!",
      link: "/blogs",
      bgColor: "#2563eb",
      textColor: "#ffffff"
    },
    mobileMenu: {
      enabled: true,
      layout: "drawer"
    }
  };

  const isValidConfig = (cfg) => {
    return (
      cfg &&
      typeof cfg === "object" &&
      typeof cfg.layout === "string" &&
      typeof cfg.logoUrl === "string" &&
      cfg.announcementBar &&
      typeof cfg.announcementBar === "object"
    );
  };

  const [config, setConfig] = useState(
    isValidConfig(initialConfig) ? initialConfig : defaultConfig
  );
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Active editor tab: "logo_layout", "announcement", "cta_menu", "mobile"
  const [activeTab, setActiveTab] = useState("logo_layout");

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/header", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(config)
      });

      if (!res.ok) {
        throw new Error("Failed to save header layout");
      }

      setSuccess("Header layout configuration saved successfully!");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateAnnouncementField = (fieldName, value) => {
    setConfig(prev => ({
      ...prev,
      announcementBar: {
        ...prev.announcementBar,
        [fieldName]: value
      }
    }));
  };

  const updateMobileField = (fieldName, value) => {
    setConfig(prev => ({
      ...prev,
      mobileMenu: {
        ...prev.mobileMenu,
        [fieldName]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Alert banners */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
          <AlertCircle className="shrink-0" size={18} />
          <div>
            <strong className="font-semibold">Operation failed:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
          <CheckCircle2 className="shrink-0" size={18} />
          <div>
            <strong className="font-semibold">Success:</strong>
            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* Editor Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Settings Panel */}
        <div className="xl:col-span-1 bg-white border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-gray-900">Header Controls</h3>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save Header"}
            </button>
          </div>

          {/* Sub-tabs Selection */}
          <div className="grid grid-cols-2 gap-1.5 text-xs text-center font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("logo_layout")}
              className={`py-2 rounded-lg border transition ${
                activeTab === "logo_layout"
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Logo & Layout
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("announcement")}
              className={`py-2 rounded-lg border transition ${
                activeTab === "announcement"
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Announcement Bar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cta_menu")}
              className={`py-2 rounded-lg border transition ${
                activeTab === "cta_menu"
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              CTA & Navigation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mobile")}
              className={`py-2 rounded-lg border transition ${
                activeTab === "mobile"
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Mobile Menu
            </button>
          </div>

          {/* Tab Render: LOGO & LAYOUT */}
          {activeTab === "logo_layout" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Logo URL</label>
                <input
                  type="text"
                  required
                  value={config.logoUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
                  placeholder="/next.svg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Logo Width (px)</label>
                  <input
                    type="number"
                    value={config.logoWidth}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoWidth: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Logo Height (px)</label>
                  <input
                    type="number"
                    value={config.logoHeight}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoHeight: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Header Layout style</label>
                <select
                  value={config.layout}
                  onChange={(e) => setConfig(prev => ({ ...prev, layout: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm bg-white"
                >
                  <option value="logo-left">Logo Left, Nav Centered, CTA Right</option>
                  <option value="logo-center">Logo Center, Nav Left, CTA Right</option>
                  <option value="logo-split">Split Header (Logo Center, Nav Around)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sticky"
                    checked={config.sticky}
                    onChange={(e) => setConfig(prev => ({ ...prev, sticky: e.target.checked }))}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <label htmlFor="sticky" className="text-xs font-semibold text-gray-700">Sticky Header</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="transparent"
                    checked={config.transparent}
                    onChange={(e) => setConfig(prev => ({ ...prev, transparent: e.target.checked }))}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <label htmlFor="transparent" className="text-xs font-semibold text-gray-700">Transparent Overlay</label>
                </div>
              </div>
            </div>
          )}

          {/* Tab Render: ANNOUNCEMENT BAR */}
          {activeTab === "announcement" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2">
                <input
                  type="checkbox"
                  id="announcementBarEnabled"
                  checked={config.announcementBar.enabled}
                  onChange={(e) => updateAnnouncementField("enabled", e.target.checked)}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <label htmlFor="announcementBarEnabled" className="text-xs font-semibold text-gray-700">Enable Announcement Bar</label>
              </div>

              {config.announcementBar.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Announcement Text</label>
                    <input
                      type="text"
                      value={config.announcementBar.text}
                      onChange={(e) => updateAnnouncementField("text", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                      placeholder="e.g. 50% discount this week!"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Redirect Link Path</label>
                    <input
                      type="text"
                      value={config.announcementBar.link || ""}
                      onChange={(e) => updateAnnouncementField("link", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
                      placeholder="/blogs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Background Color</label>
                      <input
                        type="color"
                        value={config.announcementBar.bgColor}
                        onChange={(e) => updateAnnouncementField("bgColor", e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Text Color</label>
                      <input
                        type="color"
                        value={config.announcementBar.textColor}
                        onChange={(e) => updateAnnouncementField("textColor", e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Render: CTA & MENU SELECTION */}
          {activeTab === "cta_menu" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Navigation Menu Selection</label>
                <select
                  value={config.menuType}
                  onChange={(e) => setConfig(prev => ({ ...prev, menuType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm bg-white"
                >
                  <option value="main">Main Menu (Header)</option>
                  <option value="footer">Footer Links</option>
                </select>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">CTA Button</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={config.ctaText || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                    placeholder="e.g. Contact Us"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Button Redirect Link</label>
                  <input
                    type="text"
                    value={config.ctaLink || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, ctaLink: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono"
                    placeholder="/contact"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Render: MOBILE MENU EDITOR */}
          {activeTab === "mobile" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2">
                <input
                  type="checkbox"
                  id="mobileMenuEnabled"
                  checked={config.mobileMenu.enabled}
                  onChange={(e) => updateMobileField("enabled", e.target.checked)}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <label htmlFor="mobileMenuEnabled" className="text-xs font-semibold text-gray-700">Enable Mobile responsive Menu</label>
              </div>

              {config.mobileMenu.enabled && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile Drawer Style</label>
                  <select
                    value={config.mobileMenu.layout}
                    onChange={(e) => updateMobileField("layout", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm bg-white"
                  >
                    <option value="drawer">Slide-over Side Drawer</option>
                    <option value="dropdown">Top Overlay Dropdown</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Mock Preview Panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Live Mock Header Preview</h3>
            <span className="text-[10px] bg-slate-100 border text-slate-500 px-2 py-0.5 rounded font-mono">
              Desktop Rendering View
            </span>
          </div>

          <div className="rounded-xl border bg-gray-50 shadow-xl overflow-hidden min-h-[300px] flex flex-col justify-between p-4 font-sans select-none relative">
            {/* Live Header Render box */}
            <div className={`w-full bg-white rounded-lg border shadow-sm transition overflow-hidden ${
              config.sticky ? "border-blue-200 ring-2 ring-blue-50" : ""
            }`}>
              {/* Announcement Bar */}
              {config.announcementBar.enabled && (
                <div
                  style={{
                    backgroundColor: config.announcementBar.bgColor,
                    color: config.announcementBar.textColor
                  }}
                  className="w-full py-1.5 px-4 text-center text-[10px] font-semibold tracking-wide truncate flex items-center justify-center gap-1.5"
                >
                  {config.announcementBar.text}
                </div>
              )}

              {/* Navigation Header bar */}
              <div className="px-6 py-4 flex items-center justify-between">
                {/* Logo and menu dynamic positions according to config.layout */}
                {config.layout === "logo-left" && (
                  <>
                    <div className="font-bold text-gray-800 text-xs tracking-tight shrink-0 flex items-center">
                      LOGO
                    </div>
                    <ul className="hidden md:flex gap-6 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      <li>Home</li>
                      <li>About</li>
                      <li>Services</li>
                      <li>Contact</li>
                    </ul>
                    {config.ctaText && (
                      <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-[10px] font-semibold whitespace-nowrap">
                        {config.ctaText}
                      </button>
                    )}
                  </>
                )}

                {config.layout === "logo-center" && (
                  <>
                    <ul className="hidden md:flex gap-6 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      <li>Home</li>
                      <li>Services</li>
                    </ul>
                    <div className="font-bold text-gray-800 text-xs tracking-tight shrink-0">
                      LOGO
                    </div>
                    {config.ctaText && (
                      <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-[10px] font-semibold whitespace-nowrap">
                        {config.ctaText}
                      </button>
                    )}
                  </>
                )}

                {config.layout === "logo-split" && (
                  <>
                    <div className="w-1/3 text-left">
                      <span className="text-[10px] text-gray-400 font-semibold">Menu Selection: {config.menuType}</span>
                    </div>
                    <div className="font-bold text-gray-800 text-xs tracking-tight shrink-0 w-1/3 text-center">
                      LOGO
                    </div>
                    <div className="w-1/3 text-right">
                      {config.ctaText && (
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-[10px] font-semibold whitespace-nowrap">
                          {config.ctaText}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Layout characteristics specifications info */}
            <div className="mt-8 bg-white border p-4 rounded-lg text-xs space-y-2 text-gray-600 leading-relaxed font-sans">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <Layout size={14} className="text-blue-600" />
                Active Header Settings Specifications
              </div>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li>Layout format is evaluated dynamically as <span className="font-mono text-gray-800 bg-gray-100 px-1 rounded">{config.layout}</span>.</li>
                <li>Sticky behaviors are <span className="font-semibold text-gray-800">{config.sticky ? "enabled (header locks to screen top)" : "disabled"}</span>.</li>
                <li>Mobile menus utilize a responsive <span className="font-semibold text-gray-800">{config.mobileMenu.layout}</span> overlay layout when below 768px.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
