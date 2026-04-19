"use client"

import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import type { Editor, JSONContent } from "@tiptap/core"
import {
  Heading02Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons/core-free-icons"
import { deepEqual } from "fast-equals"
import { useEffect, type ReactElement } from "react"

import { Button } from "@workspace/ui/components/button"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { cn } from "@workspace/ui/lib/utils"
import {
  cloneDoc,
  parseStoredRichTextToContent,
  richTextExtensions,
  serializeRichTextDoc,
} from "@workspace/ui/lib/rich-text-tiptap"

import type { RichTextEditorProps } from "./rich-text-editor.types.js"

const docsAreEqual = (a: JSONContent, b: JSONContent): boolean =>
  deepEqual(a, b)

type RichTextEditorToolbarProps = Readonly<{
  editor: Editor
  disabled: boolean
}>

const RichTextEditorToolbar = ({
  editor,
  disabled,
}: RichTextEditorToolbarProps) => {
  const { bold, italic, bullet, ordered, h2 } = useEditorState({
    editor,
    selector: (snap) => ({
      bold: snap.editor.isActive("bold"),
      italic: snap.editor.isActive("italic"),
      bullet: snap.editor.isActive("bulletList"),
      ordered: snap.editor.isActive("orderedList"),
      h2: snap.editor.isActive("heading", { level: 2 }),
    }),
  })

  const handleBold = () => {
    editor.chain().focus().toggleBold().run()
  }

  const handleItalic = () => {
    editor.chain().focus().toggleItalic().run()
  }

  const handleHeading = () => {
    editor.chain().focus().toggleHeading({ level: 2 }).run()
  }

  const handleBulletList = () => {
    editor.chain().focus().toggleBulletList().run()
  }

  const handleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run()
  }

  return (
    <div
      className="flex flex-wrap gap-1 border-b border-input bg-muted/40 p-1.5"
      role="toolbar"
    >
      <Button
        aria-label="Bold"
        aria-pressed={bold}
        className="size-8 sm:size-7"
        disabled={disabled}
        onClick={handleBold}
        size="icon-sm"
        type="button"
        variant={bold ? "secondary" : "outline"}
      >
        <UiIcon aria-hidden className="size-4" icon={TextBoldIcon} />
      </Button>
      <Button
        aria-label="Italic"
        aria-pressed={italic}
        className="size-8 sm:size-7"
        disabled={disabled}
        onClick={handleItalic}
        size="icon-sm"
        type="button"
        variant={italic ? "secondary" : "outline"}
      >
        <UiIcon aria-hidden className="size-4" icon={TextItalicIcon} />
      </Button>
      <Button
        aria-label="Heading"
        aria-pressed={h2}
        className="size-8 sm:size-7"
        disabled={disabled}
        onClick={handleHeading}
        size="icon-sm"
        type="button"
        variant={h2 ? "secondary" : "outline"}
      >
        <UiIcon aria-hidden className="size-4" icon={Heading02Icon} />
      </Button>
      <Button
        aria-label="Bullet list"
        aria-pressed={bullet}
        className="size-8 sm:size-7"
        disabled={disabled}
        onClick={handleBulletList}
        size="icon-sm"
        type="button"
        variant={bullet ? "secondary" : "outline"}
      >
        <UiIcon
          aria-hidden
          className="size-4"
          icon={LeftToRightListBulletIcon}
        />
      </Button>
      <Button
        aria-label="Numbered list"
        aria-pressed={ordered}
        className="size-8 sm:size-7"
        disabled={disabled}
        onClick={handleOrderedList}
        size="icon-sm"
        type="button"
        variant={ordered ? "secondary" : "outline"}
      >
        <UiIcon
          aria-hidden
          className="size-4"
          icon={LeftToRightListNumberIcon}
        />
      </Button>
    </div>
  )
}

export const RichTextEditor = ({
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
  id,
  className,
}: RichTextEditorProps): ReactElement => {
  const normalizedValue = typeof value === "string" ? value : ""

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: richTextExtensions,
      content: cloneDoc(parseStoredRichTextToContent(normalizedValue)),
      editable: !disabled,
      editorProps: {
        attributes: {
          ...(id ? { id } : {}),
          class: cn(
            "py-[calc(theme(spacing.1.5)-1px)] min-h-[8rem] w-full px-[calc(theme(spacing.3)-1px)] outline-none sm:min-h-32",
            "[&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_p]:my-1",
            "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_li]:my-0.5"
          ),
          role: "textbox",
          "aria-multiline": "true",
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        },
      },
      onUpdate: ({ editor: instance }) => {
        onChange(serializeRichTextDoc(instance.getJSON()))
      },
    },
    []
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    editor.setEditable(!disabled)
  }, [disabled, editor])

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
        aria-label={ariaLabel ?? "Loading rich text editor"}
        className={cn(
          "min-h-32 w-full rounded-lg border border-input bg-muted/20 sm:min-h-32",
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-input bg-background text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] focus-within:border-ring focus-within:ring-[3px] sm:text-sm dark:bg-input/32 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        disabled && "opacity-64",
        className
      )}
    >
      <RichTextEditorToolbar disabled={disabled} editor={editor} />
      <EditorContent
        className={cn(
          "[&_.ProseMirror]:min-h-[inherit]",
          disabled && "pointer-events-none"
        )}
        editor={editor}
      />
    </div>
  )
}
