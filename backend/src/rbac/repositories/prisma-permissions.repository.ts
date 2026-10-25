import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IPermissionsRepository } from './permissions.repository.interface';
import { Permission } from '@prisma/client';

@Injectable()
export class PrismaPermissionsRepository implements IPermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique(where: any): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where });
  }

  async create(data: any): Promise<Permission> {
    return this.prisma.permission.create({ data });
  }

  async findMany(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}
