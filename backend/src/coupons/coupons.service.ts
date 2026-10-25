import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponType, DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async getPublicCoupons(productId?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      type: 'EXTERNAL',
      OR: [
        { startDate: null },
        { startDate: { lte: now } }
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: now } }] }
      ]
    };

    if (productId) {
      where.productId = productId;
    }

    return this.prisma.coupon.findMany({ where });
  }

  async getAdminCoupons(tenantId: string, barberId?: string) {
    return this.prisma.coupon.findMany({
      where: { tenantId, ...(barberId ? { barberId } : {}) },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCoupon(tenantId: string, data: any, barberId?: string) {
    const code = data.code?.toUpperCase().trim();
    if (!code) throw new BadRequestException('Código do cupom é obrigatório');
    
    if (data.discountType === 'FIXED' && Number(data.discountValue) < 0) {
       throw new BadRequestException('Desconto não pode ser negativo');
    }
    if (data.discountType === 'PERCENTAGE' && (Number(data.discountValue) <= 0 || Number(data.discountValue) > 100)) {
       throw new BadRequestException('Desconto percentual deve estar entre 1 e 100');
    }
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
       throw new BadRequestException('Data final não pode ser anterior à data inicial');
    }

    const existing = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code } }
    });
    if (existing) throw new BadRequestException('Já existe um cupom com este código neste tenant');

    return this.prisma.coupon.create({
      data: {
        tenantId,
        code,
        description: data.description,
        type: data.type as CouponType,
        marketplace: data.marketplace,
        productId: data.productId || null,
        discountValue: data.discountValue,
        discountType: data.discountType as DiscountType,
        link: data.link,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async updateCoupon(id: string, tenantId: string, data: any) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, tenantId } });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    if (data.code) {
      data.code = data.code.toUpperCase().trim();
      const existing = await this.prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code: data.code } }
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Já existe um cupom com este código neste tenant');
      }
    }

    if (data.discountType === 'FIXED' && data.discountValue !== undefined && Number(data.discountValue) < 0) {
       throw new BadRequestException('Desconto não pode ser negativo');
    }
    
    // date validation
    const newStart = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : coupon.startDate;
    const newEnd = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : coupon.endDate;

    if (newStart && newEnd && newEnd < newStart) {
       throw new BadRequestException('Data final não pode ser anterior à data inicial');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        description: data.description,
        type: data.type as CouponType,
        marketplace: data.marketplace,
        productId: data.productId || null,
        discountValue: data.discountValue,
        discountType: data.discountType as DiscountType,
        link: data.link,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        isActive: data.isActive
      }
    });
  }

  async deleteCoupon(id: string, tenantId: string) {
    return this.prisma.coupon.deleteMany({
      where: { id, tenantId }
    });
  }
}
