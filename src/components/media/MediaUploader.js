"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

export default function MediaUploader({ onUpload }) {
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (onUpload) {
        onUpload(data.media);
      }
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label
        htmlFor="media-upload"
        className={`
          inline-flex cursor-pointer items-center gap-2 rounded-lg
          bg-black px-4 py-2 text-sm font-medium text-white
          transition hover:bg-gray-800
          ${loading ? "opacity-70 cursor-not-allowed" : ""}
        `}
      >
        <Upload size={16} />

        {loading ? "Uploading..." : "Upload Media"}
      </label>

      <input
        id="media-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
        disabled={loading}
      />
    </div>
  );
}
