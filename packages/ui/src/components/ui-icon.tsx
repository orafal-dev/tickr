import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"

export const UiIcon = ({
  strokeWidth = 1.5,
  color = "currentColor",
  size = 24,
  ...props
}: HugeiconsIconProps) => (
  <HugeiconsIcon
    color={color}
    size={size}
    strokeWidth={strokeWidth}
    {...props}
  />
)

export type { HugeiconsIconProps as UiIconProps }
