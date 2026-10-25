import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICategoryRepository } from './category.repository.interface';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<any[]> {
    return this.prisma.productCategory.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    return this.prisma.productCategory.findFirst({
      where: { id, tenantId, isActive: true },
    });
  }

  async create(tenantId: string, data: any): Promise<any> {
    return this.prisma.productCategory.create({
      data: {
        ...data,
        tenantId,
      }
    });
  }

  async update(id: string, tenantId: string, data: any): Promise<any> {
    return this.prisma.productCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<any> {
    return this.prisma.productCategory.delete({
      where: { id },
    });
  }
}
