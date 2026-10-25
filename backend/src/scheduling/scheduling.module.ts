import { Module } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { BlockedPeriodsService } from './blocked-periods.service';
import { AvailabilityRulesController } from './availability-rules.controller';
import { BlockedPeriodsController } from './blocked-periods.controller';
import { PrismaAvailabilityRulesRepository } from './repositories/prisma-availability-rules.repository';
import { AVAILABILITY_RULES_REPOSITORY } from './repositories/availability-rules.repository.interface';
import { PrismaBlockedPeriodsRepository } from './repositories/prisma-blocked-periods.repository';
import { BLOCKED_PERIODS_REPOSITORY } from './repositories/blocked-periods.repository.interface';

@Module({
  controllers: [AvailabilityRulesController, BlockedPeriodsController],
  providers: [
    AvailabilityRulesService,
    BlockedPeriodsService,
    {
      provide: AVAILABILITY_RULES_REPOSITORY,
      useClass: PrismaAvailabilityRulesRepository,
    },
    {
      provide: BLOCKED_PERIODS_REPOSITORY,
      useClass: PrismaBlockedPeriodsRepository,
    },
  ],
  exports: [AvailabilityRulesService, BlockedPeriodsService],
})
export class SchedulingModule {}
