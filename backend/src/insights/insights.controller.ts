import { Controller, Get, UseGuards } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('insights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('clients-in-risk')
  @Roles('SUPER_ADMIN', 'ADMIN')
  getClientsInRisk(@CurrentUser() user: any) {
    return this.insightsService.getClientsInRisk(user.tenantId);
  }

  @Get('vip-clients')
  @Roles('SUPER_ADMIN', 'ADMIN')
  getVIPClients(@CurrentUser() user: any) {
    return this.insightsService.getVIPClients(user.tenantId);
  }

  @Get('recurring-clients')
  @Roles('SUPER_ADMIN', 'ADMIN')
  getRecurringClients(@CurrentUser() user: any) {
    return this.insightsService.getRecurringClients(user.tenantId);
  }

  @Get('best-time')
  @Roles('SUPER_ADMIN', 'ADMIN')
  getBestDay(@CurrentUser() user: any) {
    return this.insightsService.getBestDay(user.tenantId);
  }
}
