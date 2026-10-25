import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from '../dto/checkout.dto';
import { OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, tenantId: string, checkoutDto: CheckoutDto, resolvedBarberId?: string) {
    const { items, paymentMethod } = checkoutDto;
    
    // We must run all of this in a transaction
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let discountAmount = 0;
      const orderItemsData = [];
      
      let productBarberId: string | undefined;

      for (const item of items) {
        // Fetch product with lock if supported or just check
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        
        if (!productBarberId && product.barberId) {
          productBarberId = product.barberId;
        }

        if (product.tenantId !== tenantId) {
          throw new BadRequestException(`Product ${item.productId} belongs to another tenant`);
        }

        if (product.commercializationType === 'PARCEIRO') {
          throw new BadRequestException(`Product ${product.name} is a partner product and cannot be bought internally`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }
        
        const price = product.promoPrice ? Number(product.promoPrice) : Number(product.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;

        // Stock is NOT reduced here. It will be reduced after successful payment confirmation.
        
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: itemTotal
        });
      }

      // Handle Coupon
      if (checkoutDto.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { tenantId_code: { tenantId, code: checkoutDto.couponCode.toUpperCase().trim() } }
        });

        if (!coupon) {
          throw new BadRequestException('Cupom inválido');
        }
        if (!coupon.isActive) {
          throw new BadRequestException('Cupom inativo');
        }
        if (coupon.type !== 'INTERNAL') {
          throw new BadRequestException('Cupom externo não pode ser usado no checkout interno');
        }
        const now = new Date();
        if (coupon.startDate && new Date(coupon.startDate) > now) {
          throw new BadRequestException('Cupom ainda não é válido');
        }
        if (coupon.endDate && new Date(coupon.endDate) < now) {
          throw new BadRequestException('Cupom expirado');
        }

        // Apply discount
        if (coupon.discountType === 'FIXED') {
          discountAmount = Number(coupon.discountValue);
        } else if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (Number(coupon.discountValue) / 100);
        }

        if (discountAmount > totalAmount) {
          discountAmount = totalAmount; // Prevents negative total
        }

        // Increment usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } }
        });
      }

      totalAmount = totalAmount - discountAmount;
      
      // Create Order in PENDING status.
      const order = await tx.order.create({
        data: {
          tenantId,
          customerId: userId,
          status: OrderStatus.PENDING,
          totalAmount,
          paymentMethod,
          couponCode: checkoutDto.couponCode ? checkoutDto.couponCode.toUpperCase().trim() : null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          barberId: resolvedBarberId || productBarberId || undefined,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });
      
      return order;
    });
  }

  async reorder(orderId: string, userId: string, tenantId: string) {
    const previousOrder = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId, tenantId },
      include: { items: true },
    });

    if (!previousOrder) {
      throw new BadRequestException('Previous order not found');
    }

    const checkoutDto: CheckoutDto = {
      items: previousOrder.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      paymentMethod: previousOrder.paymentMethod,
    };

    return this.checkout(userId, tenantId, checkoutDto);
  }

  async findCustomerOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      include: { items: { include: { product: true, course: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(o => ({
      ...o,
      items: o.items.map(i => ({
        ...i,
        productName: (i as any).product?.name || (i as any).course?.title || 'Produto'
      }))
    }));
  }

  async findAllOrders(tenantId: string, barberId?: string) {
    const where: any = { tenantId };
    if (barberId) {
      where.barberId = barberId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, items: { include: { product: true, course: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(o => ({
      ...o,
      items: o.items.map(i => ({
        ...i,
        productName: (i as any).product?.name || (i as any).course?.title || 'Produto'
      }))
    }));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId }
    });
    
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
  }

  async updatePixData(orderId: string, pixCode: string, pixCodeBase64: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { pixCode, pixCodeBase64 }
    });
  }

  async cancelCustomerOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new BadRequestException('Unauthorized to cancel this order');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING orders can be cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
  }
}
