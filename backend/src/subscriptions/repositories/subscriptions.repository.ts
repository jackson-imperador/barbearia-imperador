export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<any>;
  upsertSubscription(userId: string, plan: string): Promise<any>;
  cancelSubscription(userId: string): Promise<any>;
}
