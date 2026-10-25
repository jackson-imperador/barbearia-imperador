import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBlockedPeriodsRepository } from './blocked-periods.repository.interface';
import { BlockedPeriod, Barber } from '@prisma/client';

@Injectable()
export class PrismaBlockedPeriodsRepository implements IBlockedPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBarber(id: string, tenantId: string): Promise<Barber | null> {
    return this.prisma.barber.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findOverlapping(
    tenantId: string,
    barberId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeId?: string,
  ): Promise<BlockedPeriod | null> {
    return this.prisma.blockedPeriod.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        tenantId,
        barberId,
        deletedAt: null,
        OR: [
          { startDateTime: { lte: startDateTime }, endDateTime: { gt: startDateTime } },
          { startDateTime: { lt: endDateTime }, endDateTime: { gte: endDateTime } },
          { startDateTime: { gte: startDateTime }, endDateTime: { lte: endDateTime } },
        ],
      },
    });
  }

  async create(data: any): Promise<BlockedPeriod> {
    return this.prisma.$transaction(async (tx) => {
      return tx.blockedPeriod.create({ data });
    });
  }

  async count(where: any): Promise<number> {
    return this.prisma.blockedPeriod.count({ where });
  }

  async findMany(where: any, skip: number, take: number, orderBy: any): Promise<BlockedPeriod[]> {
    return this.prisma.blockedPeriod.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async findFirst(where: any): Promise<BlockedPeriod | null> {
    return this.prisma.blockedPeriod.findFirst({ where });
  }

  async update(id: string, data: any): Promise<BlockedPeriod> {
    return this.prisma.$transaction(async (tx) => {
      return tx.blockedPeriod.update({
        where: { id },
        data,
      });
    });
  }
}
