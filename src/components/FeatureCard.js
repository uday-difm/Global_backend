// src/components/FeatureCard.js
"use client";
import { useState } from "react";

export default function FeatureCard({ icon = "✨", title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen((s) => !s)}
      className="cursor-pointer p-4 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700 hover:shadow-md transition transform hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {children}
          </p>
        </div>
      </div>

      <div
        className={`mt-3 text-sm text-slate-600 dark:text-slate-300 transition-max-h overflow-hidden ${open ? "max-h-40" : "max-h-0"}`}
      >
        {open && (
          <div>
            <p>
              Click again to collapse. This area can contain more details,
              links, or examples for the feature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
