import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { IPermissionsRepository, PERMISSIONS_REPOSITORY } from './repositories/permissions.repository.interface';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly repository: IPermissionsRepository,
  ) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.repository.findUnique({
      action_resource: { action: dto.action, resource: dto.resource }
    });

    if (existing) {
      throw new ConflictException(`Permission for action ${dto.action} on resource ${dto.resource} already exists`);
    }

    return this.repository.create({
      action: dto.action,
      resource: dto.resource,
      description: dto.description
    });
  }

  async findAll() {
    return this.repository.findMany();
  }

  async findOne(id: string) {
    const permission = await this.repository.findUnique({ id });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repository.delete(id);
    return { message: 'Permission deleted successfully' };
  }
}
