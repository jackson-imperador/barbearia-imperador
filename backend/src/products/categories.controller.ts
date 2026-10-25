import { Controller, UseGuards, Get, Post, Patch, Delete, Param, Req, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('product-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @Public()
  async findAll(@CurrentUser() user: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.categoriesService.findAll(tenantId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@CurrentUser() user: any, @Body() data: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.categoriesService.create(tenantId, data);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.categoriesService.update(id, tenantId, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.categoriesService.remove(id, tenantId);
  }
}
