# Tickr

**Tickr** is an open-source, self-hostable foundation for a modern **issue tracking** product—think fast workflows, keyboard-first navigation, and a clean web experience you can extend into a hosted SaaS.

This repository is a **Turborepo monorepo**: a Next.js web app, a NestJS API, and shared UI packages. Run it locally for development, deploy it to your own infrastructure, or fork it to build your product on top.

---

## Why Tickr?

- **Issue tracking first** — designed around capturing, triaging, and shipping work, not generic project noise.
- **Own your stack** — PostgreSQL, explicit API boundaries, and no vendor lock-in for the core app.
- **SaaS-ready shape** — authentication, transactional email, and internal API keys are wired for a real multi-tenant product; you bring domains, billing, and policy.

---

## Architecture

| Area | Package / app | Role |
|------|----------------|------|
| Web | `apps/web` | Next.js 16 (App Router), React 19, Better Auth, TanStack Query |
| API | `apps/api` | NestJS 11 HTTP API and domain logic |
| UI | `packages/ui` | Shared components and Tailwind CSS v4 styles |
| Email | `packages/transactional` | React Email templates |

The web app talks to the Nest API for product features and uses **Better Auth** with PostgreSQL for sessions and identity. A shared **internal API key** protects server-to-server calls from Next to Nest.

---

## Prerequisites

- **[Bun](https://bun.sh)** (see root `packageManager` in `package.json`)
- **Node.js 20+** (engines field; some tooling still expects Node compatibility)
- **PostgreSQL** (single database shared by the web app auth layer and the API)

Optional for local email:

- **[Mailpit](https://mailpit.axllent.org)** (or any SMTP server matching your `.env`)

---

## Quick start

### 1. Install dependencies

```bash
bun install
```

### 2. Environment

Copy the example env files and fill in secrets:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Minimum checklist:

- **`BETTER_AUTH_SECRET`** — strong random string for Better Auth.
- **`DATABASE_URL`** — same Postgres URL in **both** `apps/web/.env` and `apps/api/.env`.
- **`API_INTERNAL_KEY`** — identical value in both apps (used as `x-api-internal-key` from Next to Nest).
- **`API_URL`** — in `apps/web`, point at your API (e.g. `http://localhost:3001` locally).

See inline comments in `apps/web/.env.example` for OAuth providers, SMTP, and production-only Better Auth Infra keys.

### 3. Database

Create the database (name should match your `DATABASE_URL`, e.g. `tickr`), then apply Better Auth migrations from the web app:

```bash
cd apps/web && bun run auth:migrate && cd ../..
```

### 4. Run in development

From the repository root:

```bash
bun run dev
```

This runs the Turborepo `dev` pipeline (web + API and any other configured packages). The web app defaults to Turbopack (`next dev --turbopack`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development servers via Turbo |
| `bun run build` | Production build for all workspaces |
| `bun run lint` | Lint across the monorepo |
| `bun run test` | Run tests (where configured) |
| `bun run typecheck` | TypeScript checks |

---

## Project layout

```
apps/
  api/     # NestJS API
  web/     # Next.js product UI + auth routes
packages/
  ui/      # Shared UI + Tailwind
  transactional/  # Email templates
```

---

## Contributing

Contributions are welcome: issues, docs, and pull requests. Before opening a PR:

1. Run `bun run lint` and `bun run typecheck`.
2. Run `bun run build` to ensure the monorepo still builds.

Please keep changes focused and consistent with existing patterns (Server Components by default in Next, DTO validation in Nest, TanStack Query on the client).

---

## Security

- Never commit `.env` files or real secrets.
- **`API_INTERNAL_KEY`** must stay server-side only (Next server → Nest); do not expose it as a `NEXT_PUBLIC_*` variable.

Report security-sensitive bugs privately to the maintainers once a security policy is published for the project.

---

## License

Tickr is released under the [MIT License](LICENSE).

---

## Acknowledgements

Built with [Next.js](https://nextjs.org/), [NestJS](https://nestjs.com/), [Better Auth](https://www.better-auth.com/), [TanStack Query](https://tanstack.com/query), and [Tailwind CSS](https://tailwindcss.com/).
