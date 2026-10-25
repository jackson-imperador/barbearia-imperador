import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFolder(id: string, tenantId: string) {
    return this.prisma.mediaFolder.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async createFolder(data: any) {
    return this.prisma.mediaFolder.create({ data });
  }

  async createMedia(data: any) {
    return this.prisma.media.create({ data });
  }

  async countMedia(whereClause: any) {
    return this.prisma.media.count({ where: whereClause });
  }

  async findManyMedia(whereClause: any, skip: number, take: number) {
    return this.prisma.media.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMedia(id: string, tenantId: string) {
    return this.prisma.media.findFirst({ where: { id, tenantId, deletedAt: null } });
  }
  
  async findMediaWithDeleted(id: string, tenantId: string) {
    return this.prisma.media.findFirst({ where: { id, tenantId } });
  }
  
  async findMediaByHash(hash: string, tenantId: string) {
    return this.prisma.media.findFirst({
      where: { hash, tenantId }
    });
  }

  async updateMedia(id: string, data: any) {
    return this.prisma.media.update({ where: { id }, data });
  }
}
