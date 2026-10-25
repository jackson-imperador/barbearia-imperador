import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('manage:roles')
  create(@CurrentUser() user: any, @Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(user.tenantId, createRoleDto);
  }

  @Get()
  @Permissions('read:roles')
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Get(':id')
  @Permissions('read:roles')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rolesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Permissions('manage:roles')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, user.tenantId, updateRoleDto);
  }

  @Delete(':id')
  @Permissions('manage:roles')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rolesService.remove(id, user.tenantId);
  }

  @Post(':id/permissions')
  @Permissions('manage:roles')
  assignPermission(@CurrentUser() user: any, @Param('id') roleId: string, @Body() dto: AssignPermissionDto) {
    return this.rolesService.assignPermission(roleId, dto.permissionId, user.tenantId);
  }

  @Delete(':id/permissions/:permissionId')
  @Permissions('manage:roles')
  removePermission(@CurrentUser() user: any, @Param('id') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.removePermission(roleId, permissionId, user.tenantId);
  }

  @Post('/users/:userId/assign')
  @Permissions('manage:users')
  assignRoleToUser(@CurrentUser() user: any, @Param('userId') userId: string, @Body() dto: AssignRoleDto) {
    return this.rolesService.assignToUser(userId, dto.roleId, user.tenantId);
  }

  @Delete('/users/:userId/roles/:roleId')
  @Permissions('manage:users')
  removeRoleFromUser(@CurrentUser() user: any, @Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rolesService.removeFromUser(userId, roleId, user.tenantId);
  }
}
