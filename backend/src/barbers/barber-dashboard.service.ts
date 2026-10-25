import { Injectable, NotFoundException } from '@nestjs/common';
import { BarberDashboardRepository } from './repositories/barber-dashboard.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BarberDashboardService {
  constructor(
    private readonly repository: BarberDashboardRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardData(userId: string, tenantId: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { userId },
    });

    if (!barber) {
      throw new NotFoundException('Barber profile not found for this user');
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const agenda = await this.repository.getAgendaToday(barber.id, tenantId, startOfDay, endOfDay);
    const metrics = await this.repository.getMetrics(barber.id, tenantId, startOfMonth, endOfMonth, startOfDay, endOfDay);

    // Calculate next client
    const upcomingAppointments = agenda.filter(a => new Date(a.startDateTime) > now && a.status !== 'CANCELLED');
    const nextClient = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    // Time left until next client
    let timeLeftMs = 0;
    if (nextClient) {
      timeLeftMs = new Date(nextClient.startDateTime).getTime() - now.getTime();
    }
    const timeLeftMins = Math.max(0, Math.floor(timeLeftMs / 60000));

    // Daily and monthly goals (hardcoded or from config, as requested hardcode 500)
    const dailyGoal = 500;
    const monthlyGoal = dailyGoal * 20; // Example monthly goal

    return {
      agenda,
      metrics: {
        ...metrics,
        dailyGoal,
        monthlyGoal,
        dailyProgress: Math.min(100, (metrics.dailyRevenue / dailyGoal) * 100),
        monthlyProgress: Math.min(100, (metrics.commission / monthlyGoal) * 100),
      },
      nextClient: nextClient ? {
        appointment: nextClient,
        timeLeftMins
      } : null,
    };
  }
}
