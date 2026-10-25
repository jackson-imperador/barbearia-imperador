import { Injectable } from '@nestjs/common';
import { StoreRepository } from '../repositories/store.repository';
import { CheckoutDto } from '../dto/checkout.dto';
import { OrderStatus } from '@prisma/client';
import { PaymentsService } from '../../payments/payments.service';

@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly paymentsService: PaymentsService
  ) {}

  async checkout(userId: string, tenantId: string, checkoutDto: CheckoutDto, resolvedBarberId?: string) {
    console.log('[StoreService] Checkout start:', { userId, tenantId, checkoutDto });
    const order = await this.storeRepository.checkout(userId, tenantId, checkoutDto, resolvedBarberId);
    
    if (checkoutDto.paymentMethod === 'PIX') {
      const pix = await this.paymentsService.generatePix(
        Number(order.totalAmount),
        `Order ${order.id}`,
        'cliente@imperiobarber.com',
        order.id
      );
      
      if (pix.qrCode && pix.qrCodeBase64) {
        await this.storeRepository.updatePixData(order.id, pix.qrCode, pix.qrCodeBase64);
      }
      
      console.log('[StoreService] Checkout generated PIX:', pix);
      return { order, pix };
    }

    return { order };
  }

  async reorder(orderId: string, userId: string, tenantId: string) {
    const order = await this.storeRepository.reorder(orderId, userId, tenantId);
    
    if (order.paymentMethod === 'PIX') {
      const pix = await this.paymentsService.generatePix(
        Number(order.totalAmount),
        `Order ${order.id}`,
        'cliente@imperiobarber.com',
        order.id
      );
      
      if (pix.qrCode && pix.qrCodeBase64) {
        await this.storeRepository.updatePixData(order.id, pix.qrCode, pix.qrCodeBase64);
      }
      
      return { order, pix };
    }

    return { order };
  }

  async getCustomerOrders(userId: string) {
    return this.storeRepository.findCustomerOrders(userId);
  }

  async getAllOrders(tenantId: string, barberId?: string) {
    return this.storeRepository.findAllOrders(tenantId, barberId);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, tenantId: string) {
    return this.storeRepository.updateOrderStatus(orderId, status, tenantId);
  }

  async cancelCustomerOrder(userId: string, orderId: string) {
    return this.storeRepository.cancelCustomerOrder(userId, orderId);
  }
}
