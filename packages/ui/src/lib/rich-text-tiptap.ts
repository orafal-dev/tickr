import type { Extensions, JSONContent } from "@tiptap/core"
import { generateJSON, generateText } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"

export const richTextExtensions: Extensions = [StarterKit]

/** ProseMirror mutates the node tree in place; never reuse parsed JSON references. */
export const cloneDoc = (doc: JSONContent): JSONContent =>
  JSON.parse(JSON.stringify(doc)) as JSONContent

export const makeEmptyDoc = (): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph" }],
})

const escapeHtml = (input: string): string =>
  input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const plainTextToHtml = (value: string): string => {
  if (value.length === 0) {
    return "<p></p>"
  }
  const escaped = escapeHtml(value)
  const withBreaks = escaped.replace(/\n/g, "<br />")
  return `<p>${withBreaks}</p>`
}

const isDocJson = (value: unknown): value is JSONContent => {
  if (!value || typeof value !== "object") {
    return false
  }
  const rec = value as { type?: unknown }
  return rec.type === "doc"
}

/**
 * `value` is a JSON string of a TipTap document (`editor.getJSON()`).
 * Legacy HTML or plain text from the database is converted on load.
 */
export const parseStoredRichTextToContent = (raw: string): JSONContent => {
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  if (!trimmed) {
    return makeEmptyDoc()
  }
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (isDocJson(parsed)) {
        return cloneDoc(parsed)
      }
    } catch {
      // fall through to plain-text / HTML handling
    }
  }
  if (trimmed.startsWith("<")) {
    return cloneDoc(generateJSON(trimmed, richTextExtensions) as JSONContent)
  }
  return cloneDoc(
    generateJSON(plainTextToHtml(raw), richTextExtensions) as JSONContent
  )
}

export const serializeRichTextDoc = (doc: JSONContent): string =>
  JSON.stringify(doc)

/** Coerce API JSONB / objects into a string for the editor. */
export const stringifyStoredRichTextInput = (value: unknown): string => {
  if (typeof value === "string") {
    return value
  }
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return ""
    }
  }
  return ""
}

export const isStoredRichTextContentEmpty = (stored: string): boolean => {
  const doc = parseStoredRichTextToContent(stored)
  return generateText(doc, richTextExtensions).trim().length === 0
}
