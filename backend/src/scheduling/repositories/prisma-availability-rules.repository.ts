import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IAvailabilityRulesRepository } from './availability-rules.repository.interface';
import { AvailabilityRule, Barber } from '@prisma/client';

@Injectable()
export class PrismaAvailabilityRulesRepository implements IAvailabilityRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBarber(id: string, tenantId: string): Promise<Barber | null> {
    return this.prisma.barber.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findOverlapping(
    tenantId: string,
    barberId: string,
    weekDay: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<AvailabilityRule | null> {
    return this.prisma.availabilityRule.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        tenantId,
        barberId,
        weekDay,
        deletedAt: null,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });
  }

  async create(data: any): Promise<AvailabilityRule> {
    return this.prisma.$transaction(async (tx) => {
      return tx.availabilityRule.create({ data });
    });
  }

  async count(where: any): Promise<number> {
    return this.prisma.availabilityRule.count({ where });
  }

  async findMany(where: any, skip: number, take: number, orderBy: any): Promise<AvailabilityRule[]> {
    return this.prisma.availabilityRule.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async findFirst(where: any): Promise<AvailabilityRule | null> {
    return this.prisma.availabilityRule.findFirst({ where });
  }

  async update(id: string, data: any): Promise<AvailabilityRule> {
    return this.prisma.$transaction(async (tx) => {
      return tx.availabilityRule.update({
        where: { id },
        data,
      });
    });
  }
}
