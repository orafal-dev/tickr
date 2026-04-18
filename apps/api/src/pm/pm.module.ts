import { Module } from '@nestjs/common';

import { PmAuthGuard } from './pm-auth.guard';
import { PmController } from './pm.controller';
import { PmService } from './pm.service';
import { OrganizationAccessService } from './organization-access.service';

@Module({
  controllers: [PmController],
  providers: [PmService, OrganizationAccessService, PmAuthGuard],
})
export class PmModule {}
