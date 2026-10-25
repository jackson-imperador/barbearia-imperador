import { Controller, ForbiddenException, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  private async resolveBarberId(req: any): Promise<string | undefined> {
    const roles = req.user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return undefined;
    }
    if (roles.includes('BARBER')) {
      const tenantId = req.user.tenantId || req.user.tenant || '1';
      return this.appointmentsService.getBarberIdFromUserId(req.user.id, tenantId);
    }
    return undefined;
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    if (resolvedBarberId && dto.barberId !== resolvedBarberId) {
      throw new ForbiddenException('Acesso negado: Barbeiros só podem criar agendamentos para si mesmos.');
    }
    const isAdmin = user.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'BARBER'].includes(r)) ||
      user.userRoles?.some((ur: any) => ['SUPER_ADMIN', 'ADMIN', 'BARBER'].includes(ur.role?.name));
    return this.appointmentsService.create(user.tenantId, user.id, dto, !!isAdmin);
  }

  @Public()
  @Get('availability')
  async getAvailability(
    @Query('barberId') barberId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string
  ) {
    return this.appointmentsService.getAvailability(barberId, serviceId, date);
  }

  @Get('unread-count')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  getUnreadCount(@CurrentUser() user: any) {
    return this.appointmentsService.getUnreadCount(user.tenantId);
  }

  @Patch('mark-viewed')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  @HttpCode(HttpStatus.OK)
  markViewed(@CurrentUser() user: any) {
    return this.appointmentsService.markViewed(user.tenantId);
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: AppointmentQueryDto, @Req() req: any) {
    const isCustomer = user.roles?.includes('CUSTOMER') || user.userRoles?.some((ur: any) => ur.role?.name === 'CUSTOMER'); console.log('DEBUG FIND_ALL USER:', user.id, 'ROLES:', user.roles, 'USER_ROLES:', user.userRoles, 'isCustomer:', isCustomer);
    
    // Explicitly resolve barberId to enforce BARBER isolation
    const resolvedBarberId = await this.resolveBarberId(req);

    return this.appointmentsService.findAll(user.tenantId, query, user.id, isCustomer, resolvedBarberId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    const isCustomer = user.roles?.includes('CUSTOMER') || user.userRoles?.some((ur: any) => ur.role?.name === 'CUSTOMER'); console.log('DEBUG FIND_ALL USER:', user.id, 'ROLES:', user.roles, 'USER_ROLES:', user.userRoles, 'isCustomer:', isCustomer);
    return this.appointmentsService.findOne(id, user.tenantId, user.id, isCustomer, resolvedBarberId);
  }

  @Patch(':id/reschedule')
  async reschedule(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RescheduleAppointmentDto, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    const isCustomer = user.roles?.includes('CUSTOMER') || user.userRoles?.some((ur: any) => ur.role?.name === 'CUSTOMER'); console.log('DEBUG FIND_ALL USER:', user.id, 'ROLES:', user.roles, 'USER_ROLES:', user.userRoles, 'isCustomer:', isCustomer);
    return this.appointmentsService.reschedule(id, user.tenantId, dto, user.id, isCustomer, resolvedBarberId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CancelAppointmentDto, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    const isCustomer = user.roles?.includes('CUSTOMER') || user.userRoles?.some((ur: any) => ur.role?.name === 'CUSTOMER'); console.log('DEBUG FIND_ALL USER:', user.id, 'ROLES:', user.roles, 'USER_ROLES:', user.userRoles, 'isCustomer:', isCustomer);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'CANCELLED', user.id, isCustomer, dto.reason, resolvedBarberId);
  }

  @Patch(':id/confirm')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async confirm(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'CONFIRMED', user.id, false, undefined, resolvedBarberId);
  }

  @Patch(':id/check-in')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async checkIn(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'CHECKED_IN', user.id, false, undefined, resolvedBarberId);
  }

  @Patch(':id/start')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async startService(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'IN_PROGRESS', user.id, false, undefined, resolvedBarberId);
  }

  @Patch(':id/complete')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async completeService(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'COMPLETED', user.id, false, undefined, resolvedBarberId);
  }

  @Patch(':id/no-show')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async markNoShow(@CurrentUser() user: any, @Param('id') id: string, @Req() req: any) {
    const resolvedBarberId = await this.resolveBarberId(req);
    return this.appointmentsService.updateStatus(id, user.tenantId, 'NO_SHOW', user.id, false, undefined, resolvedBarberId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.remove(id, user.tenantId);
  }

  // --- Agendamento Inteligente ---

  @Post(':id/reminders')
  addReminder(@Param('id') id: string, @Body('type') type: string) {
    return this.appointmentsService.addReminder(id, type);
  }

  @Post('favorites')
  addFavorite(
    @CurrentUser() user: any,
    @Body('serviceId') serviceId: string,
    @Body('barberId') barberId: string,
    @Body('name') name: string
  ) {
    return this.appointmentsService.addFavorite(user.id, serviceId, barberId, name);
  }

  @Get('my-favorites/list')
  getFavorites(@CurrentUser() user: any) {
    return this.appointmentsService.getFavorites(user.id);
  }

  @Post('packages')
  @Roles('SUPER_ADMIN', 'ADMIN')
  createPackage(
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('price') price: number,
    @Body('servicesCount') servicesCount: number
  ) {
    return this.appointmentsService.createPackage(user.tenantId, name, price, servicesCount);
  }

  @Get('packages/list')
  getPackages(@CurrentUser() user: any) {
    return this.appointmentsService.getPackages(user.tenantId);
  }

  @Get('me/repeat-last')
  repeatLastCut(@CurrentUser() user: any) {
    return this.appointmentsService.repeatLastCut(user.id, user.tenantId);
  }

  @Get('me/suggestions')
  getSuggestions(@CurrentUser() user: any) {
    return this.appointmentsService.getSuggestions(user.id, user.tenantId);
  }
}




