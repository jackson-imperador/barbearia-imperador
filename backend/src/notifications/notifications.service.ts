import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  // Map de userId -> array de callbacks SSE ativos
  private clients: Map<string, ((data: string) => void)[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  // Registra cliente SSE
  subscribe(userId: string, callback: (data: string) => void) {
    const existing = this.clients.get(userId) || [];
    existing.push(callback);
    this.clients.set(userId, existing);
    this.logger.log(`SSE: usuário ${userId} conectado (${existing.length} conexões)`);
  }

  // Remove cliente SSE
  unsubscribe(userId: string, callback: (data: string) => void) {
    const existing = this.clients.get(userId) || [];
    const updated = existing.filter(cb => cb !== callback);
    if (updated.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, updated);
    }
    this.logger.log(`SSE: usuário ${userId} desconectado`);
  }

  // Envia notificação em tempo real para o usuário
  private push(userId: string, notification: any) {
    const callbacks = this.clients.get(userId);
    if (callbacks && callbacks.length > 0) {
      const payload = JSON.stringify(notification);
      callbacks.forEach(cb => {
        try { cb(payload); } catch (e) {}
      });
    }
  }

  // Busca notificações não lidas de um usuário
  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Busca todas as notificações de um usuário
  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Marca notificação como lida
  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // Marca todas como lidas
  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Cria e envia notificação para um usuário
  async createAndPush(userId: string, tenantId: string, title: string, body: string, type: string = 'APPOINTMENT', data?: string) {
    const notif = await this.prisma.notification.create({
      data: { userId, tenantId, title, body, type, data },
    });
    this.push(userId, notif);
    return notif;
  }

  // Escuta evento de agendamento criado → gera notificações no app
  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: any) {
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        include: {
          customer: true,
          barber: { include: { user: true } },
          service: true,
        },
      });
      if (!apt) return;

      const dateStr = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(apt.startDateTime));

      const customer: any = apt.customer;
      const barberUser: any = apt.barber?.user;

      // Notificação para o BARBEIRO
      if (barberUser) {
        await this.createAndPush(
          barberUser.id,
          apt.tenantId,
          '📅 Novo Agendamento!',
          `${customer.firstName} ${customer.lastName} agendou *${apt.service.name}* para ${dateStr}`,
          'APPOINTMENT',
          JSON.stringify({ appointmentId: apt.id }),
        );
      }

      // Notificação para o CLIENTE
      await this.createAndPush(
        customer.id,
        apt.tenantId,
        '✅ Agendamento Confirmado!',
        `Seu horário de *${apt.service.name}* com ${barberUser?.firstName || 'o barbeiro'} foi marcado para ${dateStr}`,
        'APPOINTMENT',
        JSON.stringify({ appointmentId: apt.id }),
      );

      this.logger.log(`Notificações criadas para agendamento ${apt.id}`);
    } catch (e) {
      this.logger.error('Erro ao criar notificações de agendamento', e);
    }
  }

  // Cancelmento também gera notificação
  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: any) {
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        include: { customer: true, barber: { include: { user: true } }, service: true },
      });
      if (!apt) return;

      const dateStr = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(apt.startDateTime));

      const customer: any = apt.customer;
      await this.createAndPush(
        customer.id,
        apt.tenantId,
        '❌ Agendamento Cancelado',
        `Seu horário de *${apt.service.name}* no dia ${dateStr} foi cancelado.`,
        'CANCELLED',
        JSON.stringify({ appointmentId: apt.id }),
      );
    } catch (e) {
      this.logger.error('Erro ao criar notificação de cancelamento', e);
    }
  }
}
