import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IServicesRepository } from './services.repository.interface';
import { Service, ServiceCategory } from '@prisma/client';

@Injectable()
export class PrismaServicesRepository implements IServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCategory(id: string, tenantId: string): Promise<ServiceCategory | null> {
    return this.prisma.serviceCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async create(data: any): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  async count(where: any): Promise<number> {
    return this.prisma.service.count({ where });
  }

  async findMany(where: any, skip: number, take: number, include: any, orderBy: any): Promise<Service[]> {
    return this.prisma.service.findMany({
      where,
      skip,
      take,
      ...(include ? { include } : {}),
      orderBy,
    });
  }

  async findFirst(where: any, include?: any): Promise<Service | null> {
    return this.prisma.service.findFirst({
      where,
      ...(include ? { include } : {}),
    });
  }

  async verifyServiceOwnership(id: string, tenantId: string, barberId?: string | null): Promise<{ error?: string }> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.deletedAt) return { error: 'NOT_FOUND' };
    if (service.tenantId !== tenantId) return { error: 'FORBIDDEN' };
    if (barberId && service.barberId !== barberId) return { error: 'FORBIDDEN' };
    return {};
  }

  async update(id: string, data: any): Promise<Service> {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async reorder(tenantId: string, items: any[]): Promise<void> {
    const operations = items.map((item, index) =>
      this.prisma.service.updateMany({
        where: { id: item.id, tenantId },
        data: { displayOrder: index },
      })
    );
    await this.prisma.$transaction(operations);
  }
}
