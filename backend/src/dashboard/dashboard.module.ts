import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: 'DASHBOARD_REPOSITORY',
      useClass: DashboardRepository,
    }
  ],
  exports: [DashboardService],
})
export class DashboardModule {}