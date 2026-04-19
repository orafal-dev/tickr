import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"
import type React from "react"
import { cn } from "@workspace/ui/lib/utils"

export function Spinner({
  className,
  ...props
}: Omit<HugeiconsIconProps, "icon">): React.ReactElement {
  return (
    <HugeiconsIcon
      aria-label="Loading"
      className={cn("animate-spin", className)}
      color="currentColor"
      icon={Loading03Icon}
      role="status"
      strokeWidth={1.5}
      {...props}
    />
  )
}
