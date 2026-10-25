import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';
import { PrismaRolesRepository } from './repositories/prisma-roles.repository';
import { ROLES_REPOSITORY } from './repositories/roles.repository.interface';
import { PrismaPermissionsRepository } from './repositories/prisma-permissions.repository';
import { PERMISSIONS_REPOSITORY } from './repositories/permissions.repository.interface';

@Module({
  controllers: [RolesController, PermissionsController],
  providers: [
    RolesService,
    PermissionsService,
    {
      provide: ROLES_REPOSITORY,
      useClass: PrismaRolesRepository,
    },
    {
      provide: PERMISSIONS_REPOSITORY,
      useClass: PrismaPermissionsRepository,
    },
  ],
  exports: [RolesService, PermissionsService],
})
export class RbacModule {}
