import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('service-categories')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  create(@CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.tenantId, dto);
  }

  @Post('reorder')
  @Roles('SUPER_ADMIN', 'ADMIN')
  reorder(@CurrentUser() user: any, @Body() dto: ReorderDto) {
    return this.categoriesService.reorder(user.tenantId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: CategoryQueryDto) {
    const isCustomer = user.userRoles?.some((ur: any) => ur.role.name === 'CUSTOMER');
    return this.categoriesService.findAll(user.tenantId, query, isCustomer);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const isCustomer = user.userRoles?.some((ur: any) => ur.role.name === 'CUSTOMER');
    return this.categoriesService.findOne(id, user.tenantId, isCustomer);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.categoriesService.remove(id, user.tenantId);
  }
}
