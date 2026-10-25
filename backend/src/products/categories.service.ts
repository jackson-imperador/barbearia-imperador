import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from './repositories/category.repository.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository
  ) {}

  async findAll(tenantId: string) {
    return this.categoryRepository.findAll(tenantId);
  }

  async findOne(id: string, tenantId: string) {
    return this.categoryRepository.findById(id, tenantId);
  }

  async create(tenantId: string, data: any) {
    return this.categoryRepository.create(tenantId, data);
  }

  async update(id: string, tenantId: string, data: any) {
    return this.categoryRepository.update(id, tenantId, data);
  }

  async remove(id: string, tenantId: string) {
    return this.categoryRepository.delete(id, tenantId);
  }
}
