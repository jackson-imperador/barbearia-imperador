import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { IProductRepository, PRODUCT_REPOSITORY } from './repositories/product.repository.interface';
import { IFavoriteRepository, FAVORITE_REPOSITORY } from './repositories/favorite.repository.interface';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  async findAll(tenantId: string, barberId?: string | null) {
    return this.productRepository.findAll(tenantId, barberId);
  }

  async findOne(id: string, tenantId: string) {
    return this.productRepository.findById(id, tenantId);
  }

  async toggleFavorite(userId: string, productId: string) {
    const existing = await this.favoriteRepository.findByUserAndProduct(userId, productId);

    if (existing) {
      await this.favoriteRepository.delete(existing.id);
      return { status: 'removed' };
    } else {
      await this.favoriteRepository.create(userId, productId);
      return { status: 'added' };
    }
  }

  async getCustomerFavorites(userId: string) {
    const favorites = await this.favoriteRepository.findAllByUser(userId);
    return favorites.map((f: any) => f.product).filter(Boolean);
  }

  async create(tenantId: string, data: any, barberId?: string | null) {
    return this.productRepository.create(tenantId, data, barberId);
  }

  async update(id: string, tenantId: string, data: any, barberId?: string | null) {
    const authCheck = await this.productRepository.verifyProductOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Product not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');
    return this.productRepository.update(id, tenantId, data, barberId);
  }

  async remove(id: string, tenantId: string, barberId?: string | null) {
    const authCheck = await this.productRepository.verifyProductOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Product not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');
    return this.productRepository.delete(id, tenantId, barberId);
  }
}