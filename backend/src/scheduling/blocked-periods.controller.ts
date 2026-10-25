import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BlockedPeriodsService } from './blocked-periods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';
import { UpdateBlockedPeriodDto } from './dto/update-blocked-period.dto';
import { BlockedPeriodQueryDto } from './dto/blocked-period-query.dto';

@Controller('blocked-periods')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class BlockedPeriodsController {
  constructor(private readonly blockedPeriodsService: BlockedPeriodsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  create(@CurrentUser() user: any, @Body() dto: CreateBlockedPeriodDto) {
    return this.blockedPeriodsService.create(user.tenantId, dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  findAll(@CurrentUser() user: any, @Query() query: BlockedPeriodQueryDto) {
    return this.blockedPeriodsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blockedPeriodsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBlockedPeriodDto) {
    return this.blockedPeriodsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blockedPeriodsService.remove(id, user.tenantId);
  }
}
