import { Controller, UseGuards, Get, Post, Patch, Delete, Param, Req, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  private async getBarberId(req: any, queryBarberId?: string): Promise<string | undefined> {
    if (queryBarberId) return queryBarberId; // Se passar por query e for público/permitido

    if (!req.user) return undefined; // Público = vê todos por padrão (ou filtra via query)

    const roles = req.user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return undefined; // Admin vê todos
    }
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return undefined;
    
    const barber = await this.prisma.barber.findUnique({ where: { userId } });
    if (barber) {
      return barber.id;
    }
    return 'UNAUTHORIZED_ACCESS';
  }

  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @Public()
  async findAll(@CurrentUser() user: any, @Req() req: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    const queryBarberId = req.query?.barberId as string | undefined;
    const barberId = await this.getBarberId({ user }, queryBarberId);
    return this.productsService.findAll(tenantId, barberId);
  }

  @Get(':id')
  @Public()
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.productsService.findOne(id, tenantId);
  }

  @Post(':id/favorite')
  async toggleFavorite(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.toggleFavorite(user.id, id);
  }

  @Get('customer/favorites')
  async getFavorites(@CurrentUser() user: any) {
    return this.productsService.getCustomerFavorites(user.id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async create(@CurrentUser() user: any, @Body() data: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    const barberId = await this.getBarberId({ user }, undefined);
    return this.productsService.create(tenantId, data, barberId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    const barberId = await this.getBarberId({ user }, undefined);
    return this.productsService.update(id, tenantId, data, barberId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    const barberId = await this.getBarberId({ user }, undefined);
    return this.productsService.remove(id, tenantId, barberId);
  }
}
