import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from './refresh-token.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(userId: string): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
    });
  }

  async findValidManyByUserId(userId: string): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { userRoles: { include: { role: true } } } },
      },
    });
  }

  async updateRevoked(id: string, isRevoked: boolean): Promise<any> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked },
    });
  }

  async create(data: { userId: string; token: string; expiresAt: Date }): Promise<any> {
    return this.prisma.refreshToken.create({
      data,
    });
  }
}
