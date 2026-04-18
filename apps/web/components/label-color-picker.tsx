"use client";

import dynamic from "next/dynamic";
import type { ColorResult } from "react-color";

import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

const TwitterPicker = dynamic(
  () => import("react-color").then((mod) => mod.TwitterPicker),
  { ssr: false },
);

export type LabelColorPickerProps = Readonly<{
  value: string;
  onChange: (hex: string) => void;
  "aria-label": string;
  disabled?: boolean;
  bulletClassName?: string;
}>;

export const LabelColorPicker = ({
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled = false,
  bulletClassName,
}: LabelColorPickerProps) => {
  const handlePickerChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  return (
    <Popover modal={false}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          "border-input bg-background inline-flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-xs/5 outline-none ring-ring/24 transition-shadow focus-visible:border-ring focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-64",
          disabled && "pointer-events-none opacity-64",
        )}
        disabled={disabled}
        type="button"
      >
        <span
          aria-hidden
          className={cn(
            "ring-background size-4 shrink-0 rounded-full border border-border shadow-xs/5 ring-2",
            bulletClassName,
          )}
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverPopup
        className="[&_[data-slot=popover-viewport]]:px-2 [&_[data-slot=popover-viewport]]:py-2"
        sideOffset={6}
      >
        <TwitterPicker
          color={value}
          onChange={handlePickerChange}
          triangle="top-left"
          width="240px"
        />
      </PopoverPopup>
    </Popover>
  );
};
