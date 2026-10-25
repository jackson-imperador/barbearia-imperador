import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StoreService } from '../services/store.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CheckoutDto } from '../dto/checkout.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService, private readonly prisma: PrismaService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user: any, @Body() checkoutDto: CheckoutDto) {
    let resolvedBarberId: string | undefined = undefined;
    if (user.roles?.includes('BARBER') || user.userRoles?.some((ur: any) => ur.role?.name === 'BARBER')) {
      const barber = await this.prisma.barber.findFirst({ where: { userId: user.id, tenantId: user.tenantId } });
      if (barber) resolvedBarberId = barber.id;
    }
    return this.storeService.checkout(user.id, user.tenantId, checkoutDto, resolvedBarberId);
  }

  @Post('checkout/reorder/:orderId')
  async reorder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.storeService.reorder(orderId, user.id, user.tenantId);
  }

  @Get('orders')
  async getCustomerOrders(@CurrentUser() user: any) {
    return this.storeService.getCustomerOrders(user.id);
  }

  @Get('orders/all')
  async getAllOrders(@CurrentUser() user: any) {
    let resolvedBarberId: string | undefined = undefined;
    const isOwnerOrAdmin = user.roles?.includes('OWNER') || user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN');
    if (!isOwnerOrAdmin && (user.roles?.includes('BARBER') || user.userRoles?.some((ur: any) => ur.role?.name === 'BARBER'))) {
      const barber = await this.prisma.barber.findFirst({ where: { userId: user.id, tenantId: user.tenantId } });
      if (barber) resolvedBarberId = barber.id;
    }
    return this.storeService.getAllOrders(user.tenantId, resolvedBarberId);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.storeService.updateOrderStatus(orderId, dto.status, user.tenantId);
  }

  @Patch('orders/:id/cancel')
  async cancelCustomerOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string
  ) {
    return this.storeService.cancelCustomerOrder(user.id, orderId);
  }
}
