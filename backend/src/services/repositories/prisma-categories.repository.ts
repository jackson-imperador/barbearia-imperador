import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICategoriesRepository } from './categories.repository.interface';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class PrismaCategoriesRepository implements ICategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<ServiceCategory> {
    return this.prisma.serviceCategory.create({ data });
  }

  async count(where: any): Promise<number> {
    return this.prisma.serviceCategory.count({ where });
  }

  async findMany(where: any, skip: number, take: number, orderBy: any): Promise<ServiceCategory[]> {
    return this.prisma.serviceCategory.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async findFirst(where: any, include?: any): Promise<ServiceCategory | null> {
    return this.prisma.serviceCategory.findFirst({
      where,
      ...(include ? { include } : {}),
    });
  }

  async update(id: string, data: any): Promise<ServiceCategory> {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async reorder(tenantId: string, items: any[]): Promise<void> {
    const operations = items.map((item, index) =>
      this.prisma.serviceCategory.updateMany({
        where: { id: item.id, tenantId },
        data: { displayOrder: index },
      })
    );
    await this.prisma.$transaction(operations);
  }
}
