"use client";
import { useEffect } from "react";

// This component takes raw HTML strings and injects them into the document head or body.
// It only runs on the client, which avoids server-client hydration mismatches.
export default function ClientScripts({ headScripts, bodyScripts }) {
  useEffect(() => {
    if (headScripts) {
      // Use a template element to safely parse the HTML string
      const template = document.createElement("template");
      template.innerHTML = headScripts;
      // Append all parsed child nodes to the document head
      document.head.append(...template.content.childNodes);
    }

    if (bodyScripts) {
      const template = document.createElement("template");
      template.innerHTML = bodyScripts;
      // Prepend all parsed child nodes to the document body
      document.body.prepend(...template.content.childNodes);
    }
  }, [headScripts, bodyScripts]);

  // This component renders nothing itself
  return null;
}
