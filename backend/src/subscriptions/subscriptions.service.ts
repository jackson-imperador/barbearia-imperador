import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ISubscriptionRepository } from './repositories/subscriptions.repository';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject('SUBSCRIPTION_REPOSITORY') 
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {}

  async getUserSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async updateSubscription(userId: string, plan: string) {
    return this.subscriptionRepository.upsertSubscription(userId, plan);
  }

  async cancelSubscription(userId: string) {
    return this.subscriptionRepository.cancelSubscription(userId);
  }
}
