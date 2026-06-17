"use client";

export default function MediaGrid({ media, onDelete, onCopyUrl }) {
  if (!media.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-white">
        <p className="text-sm text-gray-500">No media uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {media.map((item) => {
        const isImage = item.mimeType?.startsWith("image/");

        return (
          <div
            key={item.id}
            className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {isImage ? (
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-lg bg-gray-200 px-4 py-3 text-lg font-bold text-gray-700">
                    {item.extension?.toUpperCase() || "FILE"}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <p
                  className="truncate text-sm font-semibold text-gray-900"
                  title={item.fileName}
                >
                  {item.fileName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {item.mimeType || "Unknown Type"}
                </p>
              </div>

              {item.width && item.height && (
                <div className="text-xs text-gray-500">
                  {item.width} × {item.height}
                </div>
              )}

              {item.size && (
                <div className="text-xs text-gray-500">
                  {(item.size / 1024).toFixed(1)} KB
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onCopyUrl(item.url)}
                  className="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-gray-100"
                >
                  Copy URL
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
