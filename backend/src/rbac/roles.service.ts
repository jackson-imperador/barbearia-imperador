import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IRolesRepository, ROLES_REPOSITORY } from './repositories/roles.repository.interface';

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly repository: IRolesRepository,
  ) {}

  async create(tenantId: string, dto: CreateRoleDto) {
    const existingRole = await this.repository.findFirst({
      name: dto.name, tenantId
    });

    if (existingRole) {
      throw new ConflictException(`Role with name ${dto.name} already exists for this tenant`);
    }

    return this.repository.create({
      name: dto.name,
      description: dto.description,
      tenantId,
    });
  }

  async findAll(tenantId: string) {
    return this.repository.findMany(
      { 
        OR: [
          { tenantId },
          { tenantId: null }
        ]
      },
      {
        permissions: {
          include: { permission: true }
        }
      }
    );
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.repository.findFirst(
      { 
        id,
        OR: [{ tenantId }, { tenantId: null }]
      },
      {
        permissions: {
          include: { permission: true }
        }
      }
    );

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, tenantId: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id, tenantId);

    if (role.tenantId === null) {
      throw new ForbiddenException('Cannot modify system-wide roles');
    }

    if (dto.name && dto.name !== role.name) {
      const existingRole = await this.repository.findFirst({
        name: dto.name, tenantId, id: { not: id }
      });

      if (existingRole) {
        throw new ConflictException(`Role with name ${dto.name} already exists`);
      }
    }

    return this.repository.update(id, { ...dto });
  }

  async remove(id: string, tenantId: string) {
    const role = await this.findOne(id, tenantId);

    if (role.tenantId === null) {
      throw new ForbiddenException('Cannot delete system-wide roles');
    }

    await this.repository.delete(id);
    return { message: 'Role deleted successfully' };
  }

  async assignToUser(userId: string, roleId: string, tenantId: string) {
    const role = await this.findOne(roleId, tenantId);
    
    const user = await this.repository.findUser(userId, tenantId);

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    const existingAssign = await this.repository.findUserRole(userId, roleId);

    if (existingAssign) {
      return existingAssign;
    }

    return this.repository.createUserRole(userId, roleId);
  }

  async removeFromUser(userId: string, roleId: string, tenantId: string) {
    await this.findOne(roleId, tenantId);
    
    const user = await this.repository.findUser(userId, tenantId);

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    try {
      await this.repository.deleteUserRole(userId, roleId);
    } catch (e) {}

    return { message: 'Role removed from user' };
  }

  async assignPermission(roleId: string, permissionId: string, tenantId: string) {
    const role = await this.findOne(roleId, tenantId);

    if (role.tenantId === null) {
      throw new ForbiddenException('Cannot modify permissions of system-wide roles from tenant scope');
    }

    const permission = await this.repository.findPermission(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.repository.findRolePermission(roleId, permissionId);

    if (existing) return existing;

    return this.repository.createRolePermission(roleId, permissionId);
  }

  async removePermission(roleId: string, permissionId: string, tenantId: string) {
    const role = await this.findOne(roleId, tenantId);

    if (role.tenantId === null) {
      throw new ForbiddenException('Cannot modify permissions of system-wide roles from tenant scope');
    }

    try {
      await this.repository.deleteRolePermission(roleId, permissionId);
    } catch (e) {}

    return { message: 'Permission removed from role' };
  }
}
