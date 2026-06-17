"use client";

import { useEffect, useState } from "react";
import MediaUploader from "@/components/media/MediaUploader";
import MediaGrid from "@/components/media/MediaGrid";
export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMedia() {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();

      setMedia(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMedia(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this file?",
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete file");
      }

      await loadMedia();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }

  async function copyUrl(url) {
    await navigator.clipboard.writeText(url);
    alert("URL copied");
  }

  useEffect(() => {
    loadMedia();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-sm text-gray-500">
            Manage images, documents, videos and other files.
          </p>
        </div>

        <MediaUploader onUpload={loadMedia} />
      </div>

      <MediaGrid media={media} onDelete={deleteMedia} onCopyUrl={copyUrl} />
    </div>
  );
}
