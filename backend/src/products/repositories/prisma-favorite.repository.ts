import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IFavoriteRepository } from './favorite.repository.interface';

@Injectable()
export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndProduct(userId: string, productId: string): Promise<any> {
    return this.prisma.customerFavorite.findUnique({
      where: { userId_productId: { userId, productId } }
    });
  }

  async create(userId: string, productId: string): Promise<any> {
    return this.prisma.customerFavorite.create({
      data: { userId, productId }
    });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.customerFavorite.delete({
      where: { id }
    });
  }

  async findAllByUser(userId: string): Promise<any[]> {
    return this.prisma.customerFavorite.findMany({
      where: { userId },
      include: { product: { include: { media: { include: { media: true } }, reviews: true } } }
    });
  }
}
