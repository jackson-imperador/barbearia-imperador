import { Role, UserRole, RolePermission, User, Permission } from '@prisma/client';

export const ROLES_REPOSITORY = 'ROLES_REPOSITORY';

export interface IRolesRepository {
  findFirst(where: any, include?: any): Promise<Role | null>;
  create(data: any): Promise<Role>;
  findMany(where: any, include?: any): Promise<Role[]>;
  update(id: string, data: any): Promise<Role>;
  delete(id: string): Promise<void>;
  
  findUser(id: string, tenantId: string): Promise<User | null>;
  findUserRole(userId: string, roleId: string): Promise<UserRole | null>;
  createUserRole(userId: string, roleId: string): Promise<UserRole>;
  deleteUserRole(userId: string, roleId: string): Promise<void>;
  
  findPermission(id: string): Promise<Permission | null>;
  findRolePermission(roleId: string, permissionId: string): Promise<RolePermission | null>;
  createRolePermission(roleId: string, permissionId: string): Promise<RolePermission>;
  deleteRolePermission(roleId: string, permissionId: string): Promise<void>;
}
