const formatUpdatedAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

type AutoSaveIndicatorProps = Readonly<{
  savedAt: string
}>

export const AutoSaveIndicator = ({ savedAt }: AutoSaveIndicatorProps) => {
  return (
    <time
      className="text-xs text-muted-foreground tabular-nums"
      dateTime={savedAt}
    >
      {formatUpdatedAt(savedAt)}
    </time>
  )
}
