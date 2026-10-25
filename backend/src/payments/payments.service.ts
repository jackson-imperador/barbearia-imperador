import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: MercadoPagoConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // We use a mock token or env variable. For this real implementation, it expects MP_ACCESS_TOKEN.
    // If not provided, it will throw in production, but we can fallback for dev.
    const token = process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
    this.client = new MercadoPagoConfig({ accessToken: token });
  }

  async generatePix(amount: number, description: string, email: string, externalReference: string) {
    try {
      const payment = new Payment(this.client);
      const result = await payment.create({
        body: {
          transaction_amount: Number(amount.toFixed(2)),
          description,
          payment_method_id: 'pix',
          external_reference: externalReference,
          payer: {
            email: email || 'cliente@imperiobarber.com'
          }
        }
      });

      return {
        qrCode: result.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        paymentId: result.id
      };
    } catch (error) {
      const isTestToken = (process.env.MP_ACCESS_TOKEN || '').startsWith('TEST');
      if (isTestToken) {
        this.logger.warn('Usando token de teste do Mercado Pago. Retornando PIX simulado (Mock).');
        return {
          qrCode: `00020101021226580014br.gov.bcb.pix0136${externalReference}5204000053039865802BR5915MOCK PIX STORE6008BRASILIA62070503***6304ABCD`,
          // Um base64 simples de um pixel transparente/placeholder (em um app real usaríamos um QR Code real, mas a string de QR code já serve para cópia)
          qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          paymentId: 999999999
        };
      }
      this.logger.error('Failed to generate PIX via MercadoPago', error);
      throw new BadRequestException('Não foi possível gerar o PIX no MercadoPago. Verifique as credenciais da loja.');
    }
  }

  async getPaymentStatus(paymentId: string) {
    // Mock payment (test/dev mode with TEST- token) — auto-approve
    const MOCK_ID = 999999999;
    if (Number(paymentId) === MOCK_ID) {
      this.logger.log('Mock payment detected — auto-confirming subscription...');
      const pendingSub = await this.prisma.userSubscription.findFirst({
        where: { isActive: false },
        include: { user: true },
      });
      if (pendingSub) {
        const externalRef = `sub_${pendingSub.plan.replace('VIP_', '').toLowerCase()}_${pendingSub.userId}_mock`;
        await this.confirmSubscription(externalRef);
        this.logger.log(`Auto-confirmed mock subscription for user ${pendingSub.userId}`);
      }
      return 'approved';
    }

    try {
      const payment = new Payment(this.client);
      const result = await payment.get({ id: paymentId });

      // If payment is approved and subscription isn't active yet (webhook may not have fired in local dev),
      // activate it now — same as processWebhook does, and idempotent.
      if (result.status === 'approved') {
        const externalRef = result.external_reference;
        if (externalRef?.startsWith('sub_')) {
          this.logger.log(`Polling detected approved payment ${paymentId} — confirming subscription`);
          await this.confirmSubscription(externalRef).catch(e =>
            this.logger.warn(`confirmSubscription via polling: ${e.message}`)
          );
        } else if (externalRef?.startsWith('course_')) {
          this.logger.log(`Polling detected approved payment ${paymentId} — confirming course`);
          await this.confirmCourseEnrollment(externalRef).catch(e =>
            this.logger.warn(`confirmCourseEnrollment via polling: ${e.message}`)
          );
        } else if (externalRef?.startsWith('apt_')) {
          this.logger.log(`Polling detected approved payment ${paymentId} — confirming appointment`);
          await this.confirmAppointment(externalRef, paymentId.toString()).catch(e =>
            this.logger.warn(`confirmAppointment via polling: ${e.message}`)
          );
        } else if (externalRef) {
          this.logger.log(`Polling detected approved payment ${paymentId} — confirming order`);
          await this.confirmPayment(externalRef).catch(e =>
            this.logger.warn(`confirmPayment via polling: ${e.message}`)
          );
        }
      }

      return result.status; // 'pending', 'approved', 'rejected', etc
    } catch (e) {
      this.logger.error('Failed to get payment status', e);
      throw new BadRequestException('Erro ao buscar status do pagamento');
    }
  }

  async processWebhook(paymentId: string) {
    this.logger.log(`Processing Webhook for payment: ${paymentId}`);
    try {
      const payment = new Payment(this.client);
      const result = await payment.get({ id: paymentId });

      if (result.status === 'approved') {
        const externalRef = result.external_reference;
        if (!externalRef) {
          this.logger.warn(`Payment ${paymentId} has no external_reference`);
          return;
        }

        if (externalRef.startsWith('sub_')) {
          await this.confirmSubscription(externalRef);
        } else if (externalRef.startsWith('course_')) {
          await this.confirmCourseEnrollment(externalRef);
        } else if (externalRef.startsWith('apt_')) {
          await this.confirmAppointment(externalRef, paymentId.toString());
        } else {
          await this.confirmPayment(externalRef);
        }
      }
    } catch (e) {
      this.logger.error('Error fetching payment from MP', e);
      throw new BadRequestException('Erro ao processar webhook do MercadoPago');
    }
  }

  private async confirmSubscription(externalRef: string) {
    const parts = externalRef.split('_');
    let plan = 'VIP_OURO';
    let userId = '';

    if (parts.length >= 3 && (parts[1] === 'ouro' || parts[1] === 'prata')) {
      plan = parts[1] === 'prata' ? 'VIP_PRATA' : 'VIP_OURO';
      userId = parts[2];
    } else {
      // old format: sub_userId_timestamp
      userId = parts[1];
    }
    
    if (!userId) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    this.logger.log(`Activating ${plan} for user ${userId}`);
    await this.prisma.userSubscription.upsert({
      where: { userId },
      update: {
        plan,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId,
        plan,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    if (!user.isManualBan && !user.isActive) {
      this.logger.log(`Unbanning user ${userId} automatically due to subscription payment`);
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
    }

    // Registra a transação no dashboard com o preço dinâmico
    const settings = await this.prisma.siteSettings.findFirst({
      select: { vipPrataPrice: true, vipOuroPrice: true }
    });
    const prataPrice = settings?.vipPrataPrice ?? 120;
    const ouroPrice = settings?.vipOuroPrice ?? 150;


    await this.prisma.financialTransaction.create({
      data: {
        tenantId: user.tenantId,
        amount: plan === 'VIP_PRATA' ? prataPrice : ouroPrice,
        type: 'INCOME',
        paymentMethod: 'PIX',
        description: `Pagamento PIX Assinatura ${plan.replace('_', ' ')}`,
      }
    });
  }

  private async confirmCourseEnrollment(externalRef: string) {
    const parts = externalRef.split('_');
    if (parts.length < 3) return;
    
    const courseId = parts[1];
    const userId = parts[2];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return;

    this.logger.log(`Activating course ${courseId} for user ${userId}`);

    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: { studentId: userId, courseId: courseId }
    });

    if (existingEnrollment) {
      this.logger.log(`User ${userId} is already enrolled in course ${courseId}. Skipping.`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.create({
        data: {
          tenantId: user.tenantId,
          courseId: courseId,
          studentId: userId,
        }
      });

      const amount = Number(course.promoPrice && Number(course.promoPrice) > 0 ? course.promoPrice : course.price);

      await tx.financialTransaction.create({
        data: {
          tenantId: user.tenantId,
          amount: amount,
          type: 'INCOME',
          paymentMethod: 'PIX',
          description: `Pagamento PIX Academy - Curso: ${course.title}`,
        }
      });
    });
  }

  private async confirmAppointment(externalRef: string, paymentId?: string) {
    const parts = externalRef.split('_');
    if (parts.length < 2) return;
    const appointmentId = parts[1];
    
    await this.prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: true, customer: true }
      });
      
      if (!apt || apt.status === 'CONFIRMED') return;
      
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { 
          status: 'CONFIRMED', 
          confirmedAt: new Date(),
          amountPaid: apt.service.price
        }
      });
      
      // Prevent duplicate financial transaction by checking if it exists
      const existingTx = await tx.financialTransaction.findUnique({
        where: { appointmentId: appointmentId }
      });
      
      if (!existingTx) {
        await tx.financialTransaction.create({
          data: {
            tenantId: apt.tenantId,
            amount: apt.service.price,
            type: 'INCOME',
            paymentMethod: 'PIX',
            description: `Pagamento PIX Agendamento WhatsApp - ${apt.service.name}`,
            appointmentId: appointmentId,
            externalBankId: paymentId?.toString()
          }
        });
      }
    });

    // Notify listeners (bot service) that the appointment is confirmed
    this.eventEmitter.emit('appointment.paid', { appointmentId });
  }

  private async confirmPayment(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found`);
        return;
      }

      if (order.status === 'CANCELLED') {
        this.logger.warn(`Order ${orderId} was cancelled but payment arrived. Recording for refund.`);
        await tx.financialTransaction.create({
          data: {
            tenantId: order.tenantId,
            amount: order.totalAmount,
            type: 'INCOME',
            paymentMethod: 'PIX',
            description: `Store Checkout - Order ${order.id} (CRÍTICO: PAGAMENTO APÓS CANCELAMENTO - NECESSÁRIO REEMBOLSO)`
          }
        });
        return;
      }

      if (order.status !== 'PENDING') {
        this.logger.log(`Order ${orderId} is not PENDING (status: ${order.status}), skipping`);
        return;
      }

      // Check stock availability atomically
      let hasInsufficientStock = false;
      for (const item of order.items) {
        if (item.productId && item.product?.commercializationType === 'PROPRIO' && item.product.stock < item.quantity) {
          hasInsufficientStock = true;
          break;
        }
      }

      if (hasInsufficientStock) {
        this.logger.warn(`Order ${orderId} paid but insufficient stock. Marking as CANCELLED for refund process.`);
        
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' }
        });

        await tx.financialTransaction.create({
          data: {
            tenantId: order.tenantId,
            amount: order.totalAmount,
            type: 'INCOME',
            paymentMethod: 'PIX',
            description: `Store Checkout - Order ${order.id} (CRÍTICO: PAGO SEM ESTOQUE - NECESSÁRIO REEMBOLSO)`
          }
        });
        
        return;
      }

      // We have stock, deduct it for PROPRIO products, and enroll for courses
      for (const item of order.items) {
        if (item.productId && item.product?.commercializationType === 'PROPRIO') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        } else if (item.courseId) {
          const existingEnrollment = await tx.enrollment.findFirst({
            where: { studentId: order.customerId, courseId: item.courseId }
          });
          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: {
                tenantId: order.tenantId,
                courseId: item.courseId,
                studentId: order.customerId,
              }
            });
            this.logger.log(`Created enrollment for course ${item.courseId} and user ${order.customerId}`);
          }
        }
      }

      // Mark as PAID
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' }
      });

      // Create Financial Transaction
      await tx.financialTransaction.create({
        data: {
          tenantId: order.tenantId,
          amount: order.totalAmount,
          type: 'INCOME',
          paymentMethod: 'PIX',
          description: `Store Checkout - Order ${order.id}`
        }
      });

      // Update Cashback & Wallet
      const cashbackEarned = Number(order.totalAmount) * 0.05;
      await tx.user.update({
        where: { id: order.customerId },
        data: { cashbackBalance: { increment: cashbackEarned } }
      });

      this.logger.log(`Order ${order.id} fully processed in Transaction!`);
    });
  }
}