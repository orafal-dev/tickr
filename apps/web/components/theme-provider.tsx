"use client"

import * as React from "react"
import { useHotkey } from "@tanstack/react-hotkeys"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  useHotkey(
    "D",
    (event) => {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    },
    {
      ignoreInputs: true,
      preventDefault: false,
      stopPropagation: false,
    }
  )

  return null
}

export { ThemeProvider }
