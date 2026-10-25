export interface IRefreshTokenRepository {
  findManyByUserId(userId: string): Promise<any[]>;
  findValidManyByUserId(userId: string): Promise<any[]>;
  updateRevoked(id: string, isRevoked: boolean): Promise<any>;
  create(data: { userId: string, token: string, expiresAt: Date }): Promise<any>;
}
