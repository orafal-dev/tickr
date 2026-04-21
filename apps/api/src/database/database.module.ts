import { Global, Module } from "@nestjs/common"
import { Pool, type PoolConfig } from "pg"

import { DATABASE_POOL } from "./database.tokens"

const createPoolFromEnv = (): Pool => {
  const urlOverride = process.env.API_DATABASE_URL?.trim()
  if (urlOverride) {
    return new Pool({ connectionString: urlOverride })
  }

  const host = process.env.PGHOST?.trim()
  const user = process.env.PGUSER?.trim()
  const password = process.env.PGPASSWORD
  const database = process.env.PGDATABASE?.trim()

  // When PGHOST is set (Docker Compose / Coolify), use libpq-style vars.
  // Coolify often injects DATABASE_URL for other apps; do not use it here or the API would miss the compose Postgres.
  if (host && user && password !== undefined && database) {
    const port = Number(process.env.PGPORT ?? "5432")
    const config: PoolConfig = {
      host,
      port: Number.isFinite(port) && port > 0 ? port : 5432,
      user,
      password,
      database,
    }
    return new Pool(config)
  }

  const connectionString = process.env.DATABASE_URL?.trim()
  if (connectionString) {
    return new Pool({ connectionString })
  }

  throw new Error(
    "Database config missing: set DATABASE_URL, or PGHOST + PGUSER + PGPASSWORD + PGDATABASE (optional PGPORT)."
  )
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (): Pool => createPoolFromEnv(),
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
