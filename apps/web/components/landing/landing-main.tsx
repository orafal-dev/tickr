"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import {
  AiMagicIcon,
  ArrowRight01Icon,
  Bug01Icon,
  ChartColumnIcon,
  FigmaIcon,
  FlashIcon,
  GitBranchIcon,
  GithubIcon,
  KeyboardIcon,
  Layers01Icon,
  ShieldKeyIcon,
  SlackIcon,
} from "@hugeicons/core-free-icons"
import { UiIcon } from "@workspace/ui/components/ui-icon"

import type { LandingShellProps } from "./landing-shell.types"
import type { LandingFeature } from "./landing.types"

const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: FlashIcon,
    title: "Lightning Fast",
    desc: "Built on a modern stack, Tickr feels instant. Navigate between issues without ever seeing a loading spinner.",
  },
  {
    icon: KeyboardIcon,
    title: "Keyboard First",
    desc: "Command menus, shortcuts, and global search mean you can manage your entire workflow without touching the mouse.",
  },
  {
    icon: GitBranchIcon,
    title: "Custom Workflows",
    desc: "Map Tickr to how your team actually works. Define custom states, labels, and automated rules effortlessly.",
  },
  {
    icon: ChartColumnIcon,
    title: "Insightful Reports",
    desc: "Generate cycle time reports, velocity charts, and burndown graphs with a single click.",
  },
  {
    icon: ShieldKeyIcon,
    title: "Enterprise Ready",
    desc: "SSO, SAML, advanced RBAC, and strict compliance standards out of the box for teams of any size.",
  },
  {
    icon: AiMagicIcon,
    title: "AI Assisted",
    desc: "Automatically triage incoming bugs, summarize long comment threads, and suggest code fixes.",
  },
]

export const LandingMain = ({ isAuthenticated }: LandingShellProps) => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    setEmail("")
  }

  const primaryHref = isAuthenticated ? "/dashboard" : "/register"
  const primaryLabel = isAuthenticated
    ? "Open dashboard"
    : "Start building for free"

  const stackIcons = useMemo(
    () =>
      [
        { icon: GithubIcon, label: "GitHub", hoverClass: "hover:text-[#181717]" },
        { icon: SlackIcon, label: "Slack", hoverClass: "hover:text-[#4A154B]" },
        { icon: FigmaIcon, label: "Figma", hoverClass: "hover:text-[#F24E1E]" },
        {
          icon: Layers01Icon,
          label: "Your stack",
          hoverClass: "hover:text-[#5E6AD2]",
        },
        {
          icon: Bug01Icon,
          label: "Quality",
          hoverClass: "hover:text-[#362D59]",
        },
      ] as const,
    [],
  )

  return (
    <div className="w-full">
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-[800px] w-[800px] translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-bl from-zinc-100 to-transparent opacity-60 blur-3xl dark:from-zinc-800" />
      <div className="pointer-events-none absolute top-40 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-zinc-50 to-transparent opacity-40 blur-3xl dark:from-zinc-900" />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-24 pb-20 text-center md:pt-32 md:pb-32">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="flex size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          Tickr v2.0 is now live. Read the changelog
          <UiIcon aria-hidden className="text-zinc-600" icon={ArrowRight01Icon} size={14} />
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl leading-[1.1] font-semibold tracking-tight text-zinc-900 md:text-7xl dark:text-zinc-50">
          Issue tracking,
          <br />
          <span className="bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-400">
            beautifully simplified.
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-zinc-500 md:text-xl dark:text-zinc-400">
          Tickr brings clarity to your development cycle. Say goodbye to cluttered
          interfaces and slow load times. Build better software, faster.
        </p>

        <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primaryHref}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-95 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {primaryLabel}
            <UiIcon aria-hidden icon={ArrowRight01Icon} size={18} />
          </Link>
          <Link
            href="/#features"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-3 font-medium text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Explore features
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="group relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white/50 p-2 shadow-2xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-zinc-950/20" />
          {/* eslint-disable-next-line @next/next/no-img-element -- remote demo asset; avoids image domain config */}
          <img
            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80"
            alt="Tickr dashboard preview"
            width={1200}
            height={675}
            className="h-auto w-full rounded-lg object-cover mix-blend-multiply grayscale contrast-125 opacity-90 dark:mix-blend-normal dark:opacity-100"
          />
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-zinc-50/50 py-12 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-8 text-center text-sm font-medium tracking-wide text-zinc-400 uppercase">
            Integrates perfectly with your existing stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 md:gap-24">
            {stackIcons.map(({ icon, label, hoverClass }) => (
              <span
                key={label}
                className={`text-zinc-500 transition-colors ${hoverClass} dark:text-zinc-400`}
                title={label}
              >
                <UiIcon aria-hidden icon={icon} size={32} />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto mb-16 max-w-3xl md:text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Built from the ground up to be lightning fast, incredibly intuitive, and
            powerfully simple.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {LANDING_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 transition-all duration-300 hover:border-zinc-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 transition-all duration-300 group-hover:scale-110 group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:border-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                <UiIcon aria-hidden icon={feature.icon} size={24} />
              </div>
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className="px-6 py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-zinc-900 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full -translate-x-1/2 bg-gradient-to-b from-white/5 to-transparent" />

          <h2 className="relative z-10 mb-6 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Ready to track issues{" "}
            <br className="hidden md:block" />
            without the headache?
          </h2>
          <p className="relative z-10 mx-auto mb-10 max-w-xl text-lg text-zinc-400">
            Join thousands of teams who have already switched to Tickr for a faster,
            cleaner development cycle.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="relative z-10 mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row"
          >
            <label htmlFor="landing-work-email" className="sr-only">
              Work email
            </label>
            <input
              id="landing-work-email"
              type="email"
              name="email"
              placeholder="Enter your work email"
              required
              value={email}
              onChange={(e) => {
                setSubmitted(false)
                setEmail(e.target.value)
              }}
              autoComplete="email"
              className="min-w-0 grow rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/30 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 font-medium whitespace-nowrap text-zinc-900 transition-colors hover:bg-zinc-100 active:scale-95"
            >
              Get Started
            </button>
          </form>
          {submitted ? (
            <p
              className="relative z-10 mt-4 text-sm text-zinc-300"
              role="status"
            >
              Thanks — we&apos;ll be in touch shortly.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
