import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ReorderDto } from './dto/reorder.dto';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from './repositories/categories.repository.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly repository: ICategoriesRepository,
  ) {}

  async create(tenantId: string, dto: CreateCategoryDto) {
    return this.repository.create({
      tenantId,
      ...dto,
    });
  }

  async findAll(tenantId: string, query: CategoryQueryDto, isCustomer: boolean = false) {
    const { page = 1, limit = 50, isActive } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId,
      deletedAt: null,
    };

    if (isCustomer) {
      whereClause.isActive = true;
    } else if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const [total, categories] = await Promise.all([
      this.repository.count(whereClause),
      this.repository.findMany(
        whereClause,
        skip,
        limit,
        { displayOrder: 'asc' },
      ),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string, isCustomer: boolean = false) {
    const whereClause: any = { id, tenantId, deletedAt: null };
    if (isCustomer) {
      whereClause.isActive = true;
    }

    const category = await this.repository.findFirst(whereClause, {
      services: {
        where: { deletedAt: null, ...(isCustomer ? { isActive: true } : {}) },
        orderBy: { displayOrder: 'asc' },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, tenantId: string, dto: UpdateCategoryDto) {
    await this.findOne(id, tenantId);

    return this.repository.update(id, dto);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.repository.update(id, { deletedAt: new Date(), isActive: false });
  }

  async reorder(tenantId: string, dto: ReorderDto) {
    await this.repository.reorder(tenantId, dto.items);
    return { message: 'Categories reordered successfully' };
  }
}
