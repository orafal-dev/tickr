"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { CheckmarkSquare04Icon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { UiIcon } from "@workspace/ui/components/ui-icon"

import type { LandingShellProps } from "./landing-shell.types"

const navLinks = [
  { name: "Product", href: "/#features" },
  { name: "Pricing", href: "/#cta" },
  { name: "Docs", href: "#" },
] as const

export const LandingNavbar = ({ isAuthenticated }: LandingShellProps) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-zinc-200/60 bg-white/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="Tickr home"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white transition-transform duration-300 group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
              <UiIcon aria-hidden icon={CheckmarkSquare04Icon} size={20} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Tickr
            </span>
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-500 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
