import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRolesRepository } from './roles.repository.interface';
import { Role, UserRole, RolePermission, User, Permission } from '@prisma/client';

@Injectable()
export class PrismaRolesRepository implements IRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(where: any, include?: any): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where,
      ...(include ? { include } : {}),
    });
  }

  async create(data: any): Promise<Role> {
    return this.prisma.role.create({ data });
  }

  async findMany(where: any, include?: any): Promise<Role[]> {
    return this.prisma.role.findMany({
      where,
      ...(include ? { include } : {}),
    });
  }

  async update(id: string, data: any): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async findUser(id: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, tenantId } });
  }

  async findUserRole(userId: string, roleId: string): Promise<UserRole | null> {
    return this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async createUserRole(userId: string, roleId: string): Promise<UserRole> {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  async deleteUserRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async findPermission(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findRolePermission(roleId: string, permissionId: string): Promise<RolePermission | null> {
    return this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  async createRolePermission(roleId: string, permissionId: string): Promise<RolePermission> {
    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async deleteRolePermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}
