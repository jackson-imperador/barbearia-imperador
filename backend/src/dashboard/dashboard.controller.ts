import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ToggleBanDto } from './dto/toggle-ban.dto';
import { ManualUpdateSubscriptionDto } from './dto/manual-update-subscription.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private async resolveBarberId(req: any): Promise<string | undefined> {
    const roles = req.user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return undefined; // Global access
    }
    const userId = req.user?.id || req.user?.sub;
    const barberId = await this.dashboardService.getBarberIdFromUserId(userId, req.user?.tenantId);
    if (!barberId) {
      throw new ForbiddenException('Acesso negado: Perfil de barbeiro não encontrado.');
    }
    return barberId;
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getMetrics(tenantId, barberId);
  }

  @Get('cash-register')
  async getCashRegister(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getCashRegister(tenantId, barberId);
  }

  @Get('crm')
  async getCrm(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getCrm(tenantId, barberId);
  }

  @Get('agenda')
  async getAgenda(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getAgenda(tenantId, barberId);
  }

  // --- Dashboard Executivo ---

  @Get('overview')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getOverview(@Request() req, @Query('barberId') queryBarberId?: string) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    let barberId = await this.resolveBarberId(req);
    if (!barberId && queryBarberId) barberId = queryBarberId;
    return this.dashboardService.getMetrics(tenantId, barberId); // reusing metrics for overview
  }

  @Get('financial')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getFinancial(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getCashRegister(tenantId, barberId); // reusing cash register
  }

  @Get('financial/detailed')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getDetailedFinancial(@Request() req, @Query('period') period: string, @Query('barberId') queryBarberId?: string) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    let barberId = await this.resolveBarberId(req);
    if (!barberId && queryBarberId) {
      barberId = queryBarberId;
    }
    return this.dashboardService.getDetailedFinancial(tenantId, period || 'Este Mês', barberId);
  }

  @Get('customers')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getCustomers(@Request() req) {
    const resolvedBarberId = await this.dashboardService.getBarberIdFromUserId(req.user.id, req.user.tenantId || req.user.tenant || '1');
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.getCrm(tenantId, resolvedBarberId); // reusing CRM
  }

  @Get('appointments')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getAppointmentsOverview(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = await this.resolveBarberId(req);
    return this.dashboardService.getAgenda(tenantId, barberId); // reusing agenda
  }

  @Get('ranking')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getRanking(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.getRanking(tenantId);
  }

  @Get('growth')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getGrowth(@Request() req) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.getGrowth(tenantId);
  }

  @Get('crm/list')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getCustomersList(@Request() req) {
    const resolvedBarberId = await this.dashboardService.getBarberIdFromUserId(req.user.id, req.user.tenantId || req.user.tenant || '1');
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.getCustomersList(tenantId, resolvedBarberId);
  }

  @Post('crm/customers')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async createCustomer(@Request() req, @Body() body: any) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.createCustomer(tenantId, body);
  }

  @Get('crm/profile/:id')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async getCustomerProfile(@Request() req, @Param('id') customerId: string) {
    const resolvedBarberId = await this.dashboardService.getBarberIdFromUserId(req.user.id, req.user.tenantId || req.user.tenant || '1');
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.getCustomerProfile(tenantId, customerId, resolvedBarberId);
  }

  @Patch('crm/customers/:id/subscription/manual')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async manualUpdateSubscription(@Request() req, @Param('id') customerId: string, @Body() body: ManualUpdateSubscriptionDto) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.manualUpdateSubscription(tenantId, customerId, body.plan);
  }

  @Patch('crm/customers/:id/ban')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BARBER')
  async toggleCustomerBan(@Request() req, @Param('id') customerId: string, @Body() body: ToggleBanDto) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.dashboardService.toggleCustomerBan(tenantId, customerId, body.isActive);
  }
}