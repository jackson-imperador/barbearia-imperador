import { BlockedPeriod, Barber } from '@prisma/client';

export const BLOCKED_PERIODS_REPOSITORY = 'BLOCKED_PERIODS_REPOSITORY';

export interface IBlockedPeriodsRepository {
  findBarber(id: string, tenantId: string): Promise<Barber | null>;
  findOverlapping(
    tenantId: string,
    barberId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeId?: string,
  ): Promise<BlockedPeriod | null>;
  create(data: any): Promise<BlockedPeriod>;
  count(where: any): Promise<number>;
  findMany(where: any, skip: number, take: number, orderBy: any): Promise<BlockedPeriod[]>;
  findFirst(where: any): Promise<BlockedPeriod | null>;
  update(id: string, data: any): Promise<BlockedPeriod>;
}
