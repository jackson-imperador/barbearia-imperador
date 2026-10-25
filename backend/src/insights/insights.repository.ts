import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getClientsInRisk(tenantId: string, thirtyDaysAgo: Date) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        userRoles: {
          some: { role: { name: 'CUSTOMER' } }
        },
        appointments: {
          some: { startDateTime: { lt: thirtyDaysAgo }, status: 'COMPLETED' },
          none: { startDateTime: { gte: thirtyDaysAgo } }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });
  }

  async getVIPClients(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        loyaltyLevel: { in: ['Gold', 'Platinum', 'VIP', 'Black'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loyaltyLevel: true,
        points: true,
      },
      orderBy: { points: 'desc' },
      take: 10
    });
  }

  async getRecurringClients(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        appointments: {
          some: { status: 'COMPLETED' }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { appointments: { where: { status: 'COMPLETED' } } }
        }
      },
      orderBy: {
        appointments: { _count: 'desc' }
      },
      take: 10
    });
  }

  async getCompletedAppointments(tenantId: string) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED'
      },
      select: {
        startDateTime: true,
        amountPaid: true,
      }
    });
  }
}
