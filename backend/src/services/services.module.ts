import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CategoriesService } from './categories.service';
import { ServicesController } from './services.controller';
import { CategoriesController } from './categories.controller';
import { PrismaCategoriesRepository } from './repositories/prisma-categories.repository';
import { CATEGORIES_REPOSITORY } from './repositories/categories.repository.interface';
import { PrismaServicesRepository } from './repositories/prisma-services.repository';
import { SERVICES_REPOSITORY } from './repositories/services.repository.interface';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, ServicesController],
  providers: [
    CategoriesService,
    ServicesService,
    {
      provide: CATEGORIES_REPOSITORY,
      useClass: PrismaCategoriesRepository,
    },
    {
      provide: SERVICES_REPOSITORY,
      useClass: PrismaServicesRepository,
    },
  ],
  exports: [CategoriesService, ServicesService],
})
export class ServicesModule {}
