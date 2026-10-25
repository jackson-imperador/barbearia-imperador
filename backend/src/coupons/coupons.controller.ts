import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService, private readonly prisma: PrismaService) {}

  @Get()
  async getPublicCoupons(@Query('productId') productId?: string) {
    return this.couponsService.getPublicCoupons(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async getAdminCoupons(@Request() req: any) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = req.user.role === "BARBER" ? await this.prisma.barber.findFirst({ where: { userId: req.user.id } }).then(b => b?.id) : undefined;
    return this.couponsService.getAdminCoupons(tenantId, barberId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCoupon(@Request() req: any, @Body() data: any) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    const barberId = req.user.role === "BARBER" ? await this.prisma.barber.findFirst({ where: { userId: req.user.id } }).then(b => b?.id) : undefined;
    return this.couponsService.createCoupon(tenantId, data, barberId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateCoupon(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.couponsService.updateCoupon(id, tenantId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCoupon(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId || req.user.tenant || '1';
    return this.couponsService.deleteCoupon(id, tenantId);
  }
}
