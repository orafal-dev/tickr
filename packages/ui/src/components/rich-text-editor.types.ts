export type RichTextEditorVariant = "frameless" | "bordered"

export type RichTextEditorProps = Readonly<{
  /** JSON string from `editor.getJSON()` (TipTap `JSONContent`). */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /**
   * `frameless`: no chrome (Linear-style description). `bordered`: inset field
   * (e.g. comments). Formatting uses a floating toolbar on text selection in
   * both variants.
   */
  variant?: RichTextEditorVariant
  "aria-label"?: string
  id?: string
  className?: string
}>
