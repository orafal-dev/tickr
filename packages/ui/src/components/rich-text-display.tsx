"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import type { JSONContent } from "@tiptap/core"
import { deepEqual } from "fast-equals"
import { useEffect, type ReactElement } from "react"

import { cn } from "@workspace/ui/lib/utils"
import {
  cloneDoc,
  parseStoredRichTextToContent,
  richTextExtensions,
} from "@workspace/ui/lib/rich-text-tiptap"

import type { RichTextDisplayProps } from "./rich-text-display.types.js"

const docsAreEqual = (a: JSONContent, b: JSONContent): boolean =>
  deepEqual(a, b)

export const RichTextDisplay = ({
  value,
  className,
  "aria-label": ariaLabel,
}: RichTextDisplayProps): ReactElement => {
  const normalizedValue = typeof value === "string" ? value : ""

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: richTextExtensions,
      editable: false,
      content: cloneDoc(parseStoredRichTextToContent(normalizedValue)),
      editorProps: {
        attributes: {
          class: cn(
            "outline-none [&_h2]:my-1 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:my-0.5",
            "[&_ul]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_li]:my-0.5"
          ),
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        },
      },
    },
    []
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    const next = cloneDoc(parseStoredRichTextToContent(normalizedValue))
    const current = editor.getJSON()
    if (docsAreEqual(current, next)) {
      return
    }
    editor.commands.setContent(next, { emitUpdate: false })
  }, [normalizedValue, editor])

  if (!editor) {
    return (
      <div
        aria-busy="true"
        aria-label={ariaLabel ?? "Loading rich text"}
        className={cn("min-h-4", className)}
      />
    )
  }

  return (
    <div className={cn("text-foreground", className)}>
      <EditorContent
        className="[&_.ProseMirror]:outline-none"
        editor={editor}
      />
    </div>
  )
}
