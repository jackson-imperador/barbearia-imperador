import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BarberDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAgendaToday(barberId: string, tenantId: string, startOfDay: Date, endOfDay: Date) {
    return this.prisma.appointment.findMany({
      where: {
        barberId,
        tenantId,
        startDateTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
          }
        }
      },
      orderBy: {
        startDateTime: 'asc',
      }
    });
  }

  async getMetrics(barberId: string, tenantId: string, startOfMonth: Date, endOfMonth: Date, startOfDay: Date, endOfDay: Date) {
    // Commission: Calculate based on completed appointments this month
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        tenantId,
        status: 'COMPLETED',
        startDateTime: {
          gte: startOfMonth,
          lt: endOfMonth,
        }
      },
      select: {
        amountPaid: true,
      }
    });

    const totalRevenue = completedAppointments.reduce((acc, curr) => {
      return acc + (curr.amountPaid ? Number(curr.amountPaid) : 0);
    }, 0);

    const completedOrders = await this.prisma.order.findMany({
      where: {
        barberId,
        tenantId,
        status: 'PAID',
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        }
      },
      select: {
        totalAmount: true,
      }
    });

    const productsRevenue = completedOrders.reduce((acc, curr) => {
      return acc + (curr.totalAmount ? Number(curr.totalAmount) : 0);
    }, 0);

    // Assuming a 50% commission rate for example, or we just return revenue. Let's return totalRevenue for now or calculate 50% commission.
    const commission = (totalRevenue * 0.5) + (productsRevenue * 0.1); // Exemplo: 50% serviços, 10% produtos

    // Daily Goal
    const dailyAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        tenantId,
        status: 'COMPLETED',
        startDateTime: {
          gte: startOfDay,
          lt: endOfDay,
        }
      },
      select: {
        amountPaid: true,
      }
    });

    const dailyRevenue = dailyAppointments.reduce((acc, curr) => {
      return acc + (curr.amountPaid ? Number(curr.amountPaid) : 0);
    }, 0);

    const dailyOrders = await this.prisma.order.findMany({
      where: {
        barberId,
        tenantId,
        status: 'PAID',
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        }
      },
      select: {
        totalAmount: true,
      }
    });
    
    const dailyProductsRevenue = dailyOrders.reduce((acc, curr) => {
      return acc + (curr.totalAmount ? Number(curr.totalAmount) : 0);
    }, 0);
    
    const totalDailyRevenue = dailyRevenue + dailyProductsRevenue;

    // Reviews
    const reviews = await this.prisma.barberReview.aggregate({
      where: { barberId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Ranking (dummy logic or just rank by revenue)
    // To do an actual rank, we'd need to compare all barbers. Let's get rank based on completed appointments count this month.
    const allBarbersStats = await this.prisma.appointment.groupBy({
      by: ['barberId'],
      where: {
        tenantId,
        status: 'COMPLETED',
        startDateTime: {
          gte: startOfMonth,
          lt: endOfMonth,
        }
      },
      _sum: {
        amountPaid: true,
      },
      orderBy: {
        _sum: {
          amountPaid: 'desc'
        }
      }
    });

    let ranking = 0;
    for (let i = 0; i < allBarbersStats.length; i++) {
      if (allBarbersStats[i].barberId === barberId) {
        ranking = i + 1;
        break;
      }
    }
    if (ranking === 0) ranking = allBarbersStats.length + 1; // if no appointments

    return {
      commission,
      dailyRevenue: totalDailyRevenue,
      reviews: {
        average: reviews._avg.rating || 0,
        count: reviews._count.rating || 0,
      },
      ranking,
    };
  }
}
