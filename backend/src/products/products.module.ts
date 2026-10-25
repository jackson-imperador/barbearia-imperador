import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PRODUCT_REPOSITORY } from './repositories/product.repository.interface';
import { PrismaProductRepository } from './repositories/prisma-product.repository';
import { CATEGORY_REPOSITORY } from './repositories/category.repository.interface';
import { PrismaCategoryRepository } from './repositories/prisma-category.repository';
import { FAVORITE_REPOSITORY } from './repositories/favorite.repository.interface';
import { PrismaFavoriteRepository } from './repositories/prisma-favorite.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, CategoriesController],
  providers: [
    ProductsService,
    CategoriesService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: FAVORITE_REPOSITORY,
      useClass: PrismaFavoriteRepository,
    },
  ],
})
export class ProductsModule {}
