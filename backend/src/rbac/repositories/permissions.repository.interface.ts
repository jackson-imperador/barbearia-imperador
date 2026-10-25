import { Permission } from '@prisma/client';

export const PERMISSIONS_REPOSITORY = 'PERMISSIONS_REPOSITORY';

export interface IPermissionsRepository {
  findUnique(where: any): Promise<Permission | null>;
  create(data: any): Promise<Permission>;
  findMany(): Promise<Permission[]>;
  delete(id: string): Promise<void>;
}
