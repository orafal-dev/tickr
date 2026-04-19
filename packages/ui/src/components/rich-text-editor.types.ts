export type RichTextEditorProps = Readonly<{
  /** JSON string from `editor.getJSON()` (TipTap `JSONContent`). */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  "aria-label"?: string
  id?: string
  className?: string
}>
