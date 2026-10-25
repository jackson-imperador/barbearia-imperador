import { Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PaginationDto } from '../dto/pagination.dto';
import { BaseService } from '../services/base.service';

@UseGuards(JwtAuthGuard, RolesGuard)
export abstract class BaseController<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly baseService: BaseService<T, CreateDto, UpdateDto>,
    protected readonly searchFields: string[] = []
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query() paginationDto: PaginationDto) {
    return this.baseService.findAll(req.user.tenantId, paginationDto, this.searchFields);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.baseService.findOne(id, req.user.tenantId);
  }

  @Post()
  async create(@Body() createDto: CreateDto, @Req() req: any) {
    return this.baseService.create(req.user.tenantId, createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDto, @Req() req: any) {
    return this.baseService.update(id, req.user.tenantId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.baseService.remove(id, req.user.tenantId);
  }
}
