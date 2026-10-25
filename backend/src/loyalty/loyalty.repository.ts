import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyRepository {
  constructor(private prisma: PrismaService) {}

  async getUserLoyaltyInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, loyaltyLevel: true, achievements: true },
    });
    return user;
  }

  async addPoints(userId: string, points: number, tenantId: string, reason?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });

    await this.prisma.loyaltyPoints.create({
      data: {
        customerId: userId,
        tenantId,
        points,
        reason,
      },
    });

    return user;
  }

  async createAchievement(userId: string, title: string, badgeUrl?: string) {
    return this.prisma.userAchievement.create({
      data: {
        userId,
        title,
        badgeUrl,
      },
    });
  }
}
