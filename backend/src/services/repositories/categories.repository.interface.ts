import { ServiceCategory } from '@prisma/client';

export const CATEGORIES_REPOSITORY = 'CATEGORIES_REPOSITORY';

export interface ICategoriesRepository {
  create(data: any): Promise<ServiceCategory>;
  count(where: any): Promise<number>;
  findMany(where: any, skip: number, take: number, orderBy: any): Promise<ServiceCategory[]>;
  findFirst(where: any, include?: any): Promise<ServiceCategory | null>;
  update(id: string, data: any): Promise<ServiceCategory>;
  reorder(tenantId: string, items: any[]): Promise<void>;
}
