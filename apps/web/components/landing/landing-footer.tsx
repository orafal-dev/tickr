import Link from "next/link"

import {
  CheckmarkSquare04Icon,
  DiscordIcon,
  GithubIcon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons"
import { UiIcon } from "@workspace/ui/components/ui-icon"

export const LandingFooter = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-100 bg-white pt-16 pb-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2"
              aria-label="Tickr home"
            >
              <div className="flex size-6 items-center justify-center rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <UiIcon aria-hidden icon={CheckmarkSquare04Icon} size={14} />
              </div>
              <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Tickr
              </span>
            </Link>
            <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              Issue tracking simplified for modern product teams who move fast.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#cta"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  API Reference
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Connect
            </h4>
            <div className="flex items-center gap-4 text-zinc-400">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Tickr on X"
              >
                <UiIcon aria-hidden icon={NewTwitterIcon} size={20} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Tickr on GitHub"
              >
                <UiIcon aria-hidden icon={GithubIcon} size={20} />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Tickr on Discord"
              >
                <UiIcon aria-hidden icon={DiscordIcon} size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-8 sm:flex-row dark:border-zinc-800">
          <p className="text-xs text-zinc-400">
            © {year} Tickr Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
