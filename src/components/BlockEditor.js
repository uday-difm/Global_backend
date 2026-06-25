"use client";

import { useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function BlockEditor({
  initialContent,
  fallbackHtml,
  onChangeHtml,
  onChangeJson,
}) {
  // Initialize the editor with existing JSON blocks if available
  const editor = useCreateBlockNote({
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
  });

  // Asynchronously parse and load fallback HTML if JSON content is empty
  useEffect(() => {
    if (!initialContent && fallbackHtml && editor) {
      const parseAndLoad = async () => {
        try {
          if (typeof editor.tryParseHTMLToBlocks === "function") {
            const blocks = await editor.tryParseHTMLToBlocks(fallbackHtml);
            editor.replaceBlocks(editor.document, blocks);
          } else {
            console.warn("tryParseHTMLToBlocks is not a function on this BlockNote editor instance");
          }
        } catch (err) {
          console.error("Failed to parse and load fallback HTML in BlockEditor:", err);
        }
      };
      parseAndLoad();
    }
  }, [initialContent, fallbackHtml, editor]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white z-10">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={async () => {
          // 1. Save the raw JSON blocks (best for saving to DB for future editing)
          const jsonBlocks = JSON.stringify(editor.document);
          if (onChangeJson) onChangeJson(jsonBlocks);

          // 2. Generate clean HTML (for the layman-litigation frontend)
          const html = await editor.blocksToHTMLLossy(editor.document);
          if (onChangeHtml) onChangeHtml(html);
        }}
      />
    </div>
  );
}
