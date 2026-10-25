import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto> {
  constructor(protected readonly model: any) {}

  async findAll(tenantId: string, paginationDto: PaginationDto, searchFields: string[] = []) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = { tenantId, deletedAt: null };

    if (search && searchFields.length > 0) {
      where.OR = searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' }
      }));
    }

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      this.model.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string, tenantId: string) {
    const record = await this.model.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async create(tenantId: string, createDto: CreateDto) {
    return this.model.create({
      data: { ...createDto, tenantId }
    });
  }

  async update(id: string, tenantId: string, updateDto: UpdateDto) {
    await this.findOne(id, tenantId); // ensure exists and belongs to tenant
    return this.model.update({
      where: { id },
      data: updateDto
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    // Soft delete
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
