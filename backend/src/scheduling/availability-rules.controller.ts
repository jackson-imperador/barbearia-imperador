import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { AvailabilityRuleQueryDto } from './dto/availability-rule-query.dto';

@Controller('availability-rules')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AvailabilityRulesController {
  constructor(private readonly rulesService: AvailabilityRulesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  create(@CurrentUser() user: any, @Body() dto: CreateAvailabilityRuleDto) {
    return this.rulesService.create(user.tenantId, dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  findAll(@CurrentUser() user: any, @Query() query: AvailabilityRuleQueryDto) {
    return this.rulesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rulesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAvailabilityRuleDto) {
    return this.rulesService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rulesService.remove(id, user.tenantId);
  }
}
