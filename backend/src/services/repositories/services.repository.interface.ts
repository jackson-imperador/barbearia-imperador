import { Service, ServiceCategory } from '@prisma/client';

export const SERVICES_REPOSITORY = 'SERVICES_REPOSITORY';

export interface IServicesRepository {
  findCategory(id: string, tenantId: string): Promise<ServiceCategory | null>;
  create(data: any): Promise<Service>;
  count(where: any): Promise<number>;
  findMany(where: any, skip: number, take: number, include: any, orderBy: any): Promise<Service[]>;
  findFirst(where: any, include?: any): Promise<Service | null>;
  update(id: string, data: any): Promise<Service>;
  verifyServiceOwnership(id: string, tenantId: string, barberId?: string | null): Promise<{ error?: string }>;
  reorder(tenantId: string, items: any[]): Promise<void>;
}
