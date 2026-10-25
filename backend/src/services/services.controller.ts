import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly prisma: PrismaService
  ) {}
  
  private async getBarberId(req: any): Promise<string | undefined> {
    const roles = req.user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return undefined;
    }
    const userId = req.user?.id || req.user?.sub;
    // If no user is logged in (public request), just return undefined
    if (!userId) return undefined;
    const barber = await this.prisma.barber.findUnique({ where: { userId } });
    if (barber) return barber.id;
    return 'UNAUTHORIZED_ACCESS';
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async create(@Req() req: any, @Body() dto: CreateServiceDto) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) tenantId = await this.servicesService.getDefaultTenantId();
    const barberId = await this.getBarberId(req);
    return this.servicesService.create(tenantId, dto, barberId);
  }

  @Post('reorder')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async reorder(@Req() req: any, @Body() dto: ReorderDto) {
    const barberId = await this.getBarberId(req);
    return this.servicesService.reorder(req.user.tenantId, dto, barberId);
  }

  @Get()
  @Public()
  async findAll(@Req() req: any, @Query() query: ServiceQueryDto) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) {
      tenantId = await this.servicesService.getDefaultTenantId();
    }
    const isCustomer = req.user?.roles?.includes('CUSTOMER') ?? true;
    const barberId = await this.getBarberId(req);
    // Barbeiros colaboradores devem ver TODOS os serviços da barbearia, mas a service vai mapear a flag isActive individual.
    return this.servicesService.findAll(tenantId, query, isCustomer, barberId === 'UNAUTHORIZED_ACCESS' ? null : barberId);
  }

  @Get(':id')
  @Public()
  async findOne(@Req() req: any, @Param('id') id: string) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) {
      tenantId = await this.servicesService.getDefaultTenantId();
    }
    const isCustomer = req.user?.roles?.includes('CUSTOMER') ?? true;
    const barberId = await this.getBarberId(req);
    return this.servicesService.findOne(id, tenantId, isCustomer, barberId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) tenantId = await this.servicesService.getDefaultTenantId();
    const barberId = await this.getBarberId(req);
    return this.servicesService.update(id, tenantId, dto, barberId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async remove(@Req() req: any, @Param('id') id: string) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) tenantId = await this.servicesService.getDefaultTenantId();
    const barberId = await this.getBarberId(req);
    return this.servicesService.remove(id, tenantId, barberId);
  }
}
