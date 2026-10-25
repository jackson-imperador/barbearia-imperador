import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { InsightsRepository } from './insights.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InsightsController],
  providers: [InsightsService, InsightsRepository],
  exports: [InsightsService, InsightsRepository],
})
export class InsightsModule {}
