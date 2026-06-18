"use client";

import { useState, useEffect } from "react";

export default function SettingsEditor({ siteId, initialSettings }) {
  // The 'analytics' and 'scripts' objects can be null, so we provide default values
  const [analytics, setAnalytics] = useState(initialSettings?.analytics || {});
  const [scripts, setScripts] = useState(initialSettings?.scripts || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAnalyticsChange = (e) => {
    const { name, value } = e.target;
    setAnalytics((prev) => ({ ...prev, [name]: value }));
  };

  const handleScriptsChange = (e) => {
    const { name, value } = e.target;
    setScripts((prev) => ({ ...prev, [name]: value }));
  };

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
      const res = await fetch("/api/admin/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          <p>Settings saved successfully!</p>
        </div>
      )}

      {/* Analytics Section */}
      <div className="p-6 bg-white shadow rounded-md">
        <h2 className="text-lg font-semibold mb-4">Analytics & Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="googleAnalyticsId"
              className="block text-sm font-medium text-gray-700"
            >
              Google Analytics ID
            </label>
            <input
              type="text"
              name="googleAnalyticsId"
              id="googleAnalyticsId"
              value={analytics.googleAnalyticsId || ""}
              onChange={handleAnalyticsChange}
              className="mt-1 block w-full input"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label
              htmlFor="clarityId"
              className="block text-sm font-medium text-gray-700"
            >
              Microsoft Clarity ID
            </label>
            <input
              type="text"
              name="clarityId"
              id="clarityId"
              value={analytics.clarityId || ""}
              onChange={handleAnalyticsChange}
              className="mt-1 block w-full input"
              placeholder="xxxxxxxxxx"
            />
          </div>
          <div>
            <label
              htmlFor="googleTagManagerId"
              className="block text-sm font-medium text-gray-700"
            >
              Google Tag Manager ID
            </label>
            <input
              type="text"
              name="googleTagManagerId"
              id="googleTagManagerId"
              value={analytics.googleTagManagerId || ""}
              onChange={handleAnalyticsChange}
              className="mt-1 block w-full input"
              placeholder="GTM-XXXXXXX"
            />
          </div>
        </div>
      </div>

      {/* Custom Scripts Section */}
      <div className="p-6 bg-white shadow rounded-md">
        <h2 className="text-lg font-semibold mb-4">Custom Scripts</h2>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="headScripts"
              className="block text-sm font-medium text-gray-700"
            >
              Scripts for &lt;head&gt;
            </label>
            {/* CORRECTED NAME ATTRIBUTE BELOW */}
            <textarea
              name="head"
              id="headScripts"
              value={scripts.head || ""}
              onChange={handleScriptsChange}
              rows={8}
              className="mt-1 block w-full input font-mono text-sm"
              placeholder={`<script>... a script to inject in the head tag ...</script>`}
            />
          </div>
          <div>
            <label
              htmlFor="bodyScripts"
              className="block text-sm font-medium text-gray-700"
            >
              Scripts for start of &lt;body&gt;
            </label>
            {/* CORRECTED NAME ATTRIBUTE BELOW */}
            <textarea
              name="body"
              id="bodyScripts"
              value={scripts.body || ""}
              onChange={handleScriptsChange}
              rows={8}
              className="mt-1 block w-full input font-mono text-sm"
              placeholder={`<!-- a script to inject after the opening body tag -->`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
