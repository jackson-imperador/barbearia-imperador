import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaSubscriptionRepository } from './repositories/prisma-subscriptions.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    {
      provide: 'SUBSCRIPTION_REPOSITORY',
      useClass: PrismaSubscriptionRepository,
    },
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
