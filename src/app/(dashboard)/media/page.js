"use client";

import { useState } from "react";

export default function MediaPage() {
  const [file, setFile] = useState(null);

  async function uploadFile() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log(data);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Media Library</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={uploadFile} className="mt-4 border px-4 py-2">
        Upload
      </button>
    </div>
  );
}
