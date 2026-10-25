import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyRepository } from './loyalty.repository';

@Injectable()
export class LoyaltyService {
  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async getLoyaltyInfo(userId: string) {
    const user = await this.loyaltyRepository.getUserLoyaltyInfo(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async addPoints(userId: string, points: number, tenantId: string, reason?: string) {
    return this.loyaltyRepository.addPoints(userId, points, tenantId, reason);
  }

  async awardAchievement(userId: string, title: string, badgeUrl?: string) {
    return this.loyaltyRepository.createAchievement(userId, title, badgeUrl);
  }
}
