import type * as React from "react"

export type NavMainSubItem = {
  title: string
  url: string
}

export type NavMainItem = {
  title: string
  url: string
  icon: React.ReactNode
  match?: "exact" | "prefix"
  items?: NavMainSubItem[]
}
