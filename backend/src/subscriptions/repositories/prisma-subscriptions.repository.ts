import { Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from './subscriptions.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
    });
  }

  async upsertSubscription(userId: string, plan: any) {
    return this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        isActive: true,
      },
      update: {
        plan,
        isActive: true,
        endDate: null,
      },
    });
  }

  async cancelSubscription(userId: string) {
    return this.prisma.userSubscription.update({
      where: { userId },
      data: { isActive: false, endDate: new Date() },
    });
  }
}
