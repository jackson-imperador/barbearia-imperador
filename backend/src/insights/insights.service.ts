import { Injectable } from '@nestjs/common';
import { InsightsRepository } from './insights.repository';

@Injectable()
export class InsightsService {
  constructor(private readonly insightsRepository: InsightsRepository) {}

  async getClientsInRisk(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.insightsRepository.getClientsInRisk(tenantId, thirtyDaysAgo);
  }

  async getVIPClients(tenantId: string) {
    return this.insightsRepository.getVIPClients(tenantId);
  }

  async getRecurringClients(tenantId: string) {
    const recurring = await this.insightsRepository.getRecurringClients(tenantId);
    return recurring.filter(c => c._count.appointments > 1);
  }

  async getBestDay(tenantId: string) {
    const appointments = await this.insightsRepository.getCompletedAppointments(tenantId);

    if (appointments.length === 0) {
      return {
        bestDay: "N/A",
        bestTime: "N/A",
        estimatedRevenue: 0.00
      };
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Array(7).fill(0);
    const timeCounts: Record<string, number> = {};
    let totalRevenue = 0;

    for (const appt of appointments) {
      const date = new Date(appt.startDateTime);
      const day = date.getDay();
      dayCounts[day]++;

      const hour = date.getHours().toString().padStart(2, '0');
      const timeStr = `${hour}:00`;
      timeCounts[timeStr] = (timeCounts[timeStr] || 0) + 1;

      if (appt.amountPaid) {
        totalRevenue += Number(appt.amountPaid);
      }
    }

    const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const bestDay = days[bestDayIndex];

    let bestTime = "N/A";
    let maxTimeCount = -1;
    for (const [time, count] of Object.entries(timeCounts)) {
      if (count > maxTimeCount) {
        maxTimeCount = count;
        bestTime = time;
      }
    }

    return {
      bestDay,
      bestTime,
      estimatedRevenue: totalRevenue
    };
  }
}
