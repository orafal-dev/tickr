import { Global, Module } from "@nestjs/common"
import { Pool } from "pg"

import { DATABASE_POOL } from "./database.tokens"

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (): Pool => {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString || connectionString.length === 0) {
          throw new Error("DATABASE_URL is required for the API process.")
        }
        return new Pool({ connectionString })
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
