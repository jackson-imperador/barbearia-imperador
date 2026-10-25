import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IProductRepository } from './product.repository.interface';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async verifyProductOwnership(productId: string, tenantId: string, barberId?: string | null) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.tenantId !== tenantId) return { error: 'NOT_FOUND' };
    if (barberId !== undefined && product.barberId !== barberId) return { error: 'FORBIDDEN' };
    return { success: true, product };
  }


  async findAll(tenantId: string, barberId?: string | null): Promise<any[]> {
    const whereClause: any = { tenantId, isActive: true };
    
    // Se o usuário não for ADMIN/OWNER e o admin quiser ver tudo, `barberId` vem como `undefined`.
    // Se for uma requisição para ver produtos de um barbeiro específico, `barberId` será o ID do barbeiro.
    if (barberId !== undefined) {
      whereClause.barberId = barberId;
    }

    return this.prisma.product.findMany({
      where: whereClause,
      include: { media: { include: { media: true } }, reviews: true, image: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    return this.prisma.product.findFirst({
      where: { id, tenantId, isActive: true },
      include: { media: { include: { media: true } }, reviews: true, image: true },
    });
  }

  async create(tenantId: string, data: any, barberId?: string): Promise<any> {
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId,
        ...(barberId ? { barberId } : {}),
      }
    });
  }

  async update(id: string, tenantId: string, data: any, barberId?: string | null): Promise<any> {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string, barberId?: string | null): Promise<any> {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
