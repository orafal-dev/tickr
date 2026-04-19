import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { DatabaseModule } from "./database/database.module"
import { PmModule } from "./pm/pm.module"

@Module({
  imports: [DatabaseModule, PmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
