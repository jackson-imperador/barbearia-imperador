import { AvailabilityRule, Barber } from '@prisma/client';

export const AVAILABILITY_RULES_REPOSITORY = 'AVAILABILITY_RULES_REPOSITORY';

export interface IAvailabilityRulesRepository {
  findBarber(id: string, tenantId: string): Promise<Barber | null>;
  findOverlapping(
    tenantId: string,
    barberId: string,
    weekDay: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<AvailabilityRule | null>;
  create(data: any): Promise<AvailabilityRule>;
  count(where: any): Promise<number>;
  findMany(where: any, skip: number, take: number, orderBy: any): Promise<AvailabilityRule[]>;
  findFirst(where: any): Promise<AvailabilityRule | null>;
  update(id: string, data: any): Promise<AvailabilityRule>;
}
