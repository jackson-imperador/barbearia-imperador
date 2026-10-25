import { Controller, Get, UseGuards } from '@nestjs/common';
import { BarberDashboardService } from './barber-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('barber-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarberDashboardController {
  constructor(private readonly dashboardService: BarberDashboardService) {}

  @Get()
  @Roles('BARBER', 'ADMIN', 'SUPER_ADMIN')
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDashboardData(user.id, user.tenantId);
  }
}
