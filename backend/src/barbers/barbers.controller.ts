import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { BarberQueryDto } from './dto/barber-query.dto';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { CreateDayOffDto } from './dto/create-day-off.dto';
import { CreateVacationDto } from './dto/create-vacation.dto';

@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class BarbersController {
  private async checkBarberIdentity(user: any, targetBarberId: string) {
    const roles = user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return; // Admins can edit anyone
    }
    if (roles.includes('BARBER')) {
      const userId = user?.id || user?.sub;
      const tenantId = user?.tenantId || user?.tenant || '1';
      const barber = await this.barbersService['prisma'].barber.findFirst({
        where: { userId, tenantId, deletedAt: null }
      });
      if (!barber || barber.id !== targetBarberId) {
        throw new ForbiddenException('Acesso negado: Você só pode modificar o seu próprio perfil.');
      }
    }
  }

  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@CurrentUser() user: any, @Body() dto: CreateBarberDto) {
    let tenantId = user?.tenantId;
    if (!tenantId) tenantId = await this.barbersService.getDefaultTenantId();
    return this.barbersService.create(tenantId, dto);
  }

  @Get()
  @Public()
  async findAll(@CurrentUser() user: any, @Query() query: BarberQueryDto) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      tenantId = await this.barbersService.getDefaultTenantId();
    }
    const isCustomer = user?.roles?.includes('CUSTOMER') ?? true;
    return this.barbersService.findAll(tenantId, query, isCustomer);
  }

  @Get('me')
  @Roles('BARBER', 'OWNER', 'ADMIN', 'SUPER_ADMIN')
  async findMyProfile(@CurrentUser() user: any) {
    // Pega o userId diretamente do token JWT
    const userId = user?.id || user?.sub;
    if (!userId) {
      return { data: null };
    }
    let tenantId = user?.tenantId;
    if (!tenantId) {
      tenantId = await this.barbersService.getDefaultTenantId();
    }
    const barber = await this.barbersService['prisma'].barber.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        workingHours: true,
      }
    });
    return { data: barber };
  }

  @Get(':id')
  @Public()
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    let tenantId = user?.tenantId;
    if (!tenantId) {
      tenantId = await this.barbersService.getDefaultTenantId();
    }
    const isCustomer = user?.roles?.includes('CUSTOMER') ?? true;
    return this.barbersService.findOne(id, tenantId, isCustomer);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBarberDto) {
    await this.checkBarberIdentity(user, id);
    let tenantId = user?.tenantId;
    if (!tenantId) tenantId = await this.barbersService.getDefaultTenantId();
    return this.barbersService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    let tenantId = user?.tenantId;
    if (!tenantId) tenantId = await this.barbersService.getDefaultTenantId();
    return this.barbersService.remove(id, tenantId);
  }

  @Post(':id/photo')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async uploadPhoto(@CurrentUser() user: any, @Param('id') id: string, @Body() fileData: any) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.uploadPhoto(id, user.tenantId, fileData);
  }

  @Post(':id/working-hours')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async setWorkingHour(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateWorkingHourDto) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.setWorkingHour(id, user.tenantId, dto);
  }

  @Post(':id/days-off')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async addDayOff(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateDayOffDto) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.addDayOff(id, user.tenantId, dto);
  }

  @Delete(':id/days-off/:dayOffId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async removeDayOff(@CurrentUser() user: any, @Param('id') id: string, @Param('dayOffId') dayOffId: string) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.removeDayOff(id, user.tenantId, dayOffId);
  }

  @Post(':id/vacations')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async addVacation(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateVacationDto) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.addVacation(id, user.tenantId, dto);
  }

  @Delete(':id/vacations/:vacationId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async removeVacation(@CurrentUser() user: any, @Param('id') id: string, @Param('vacationId') vacationId: string) {
    await this.checkBarberIdentity(user, id);
    return this.barbersService.removeVacation(id, user.tenantId, vacationId);
  }
}
