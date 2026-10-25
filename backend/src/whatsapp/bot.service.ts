import { Injectable, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly appointmentsService: AppointmentsService,
    private readonly paymentsService: PaymentsService
  ) {}

  onModuleInit() {
    // Run expiration check every 1 minute
    setInterval(() => {
      this.checkExpiredSessions().catch(err => this.logger.error('Error checking expired sessions', err));
    }, 60 * 1000);
  }

  private async checkExpiredSessions() {
    const expiredSessions = await this.prisma.botSession.findMany({
      where: { expiresAt: { lt: new Date() } }
    });

    for (const session of expiredSessions) {
      try {
        if (session.appointmentId) {
          const apt = await this.prisma.appointment.findUnique({ where: { id: session.appointmentId } });
          if (apt && apt.status === 'PENDING') {
            await this.prisma.appointment.update({
              where: { id: apt.id },
              data: { status: 'CANCELLED', cancellationReason: 'Tempo para pagamento PIX expirado (Bot Fallback)' }
            });
            await this.whatsappService.sendMessage(session.phone, `Seu tempo para pagamento expirou e a reserva foi cancelada. Caso deseje tentar novamente, mande um "Olá".`);
          }
        }
        await this.prisma.botSession.delete({ where: { id: session.id } });
      } catch (err) {
        this.logger.error(`Error cleaning up expired session for ${session.phone}`, err);
      }
    }
  }

  @OnEvent('whatsapp.message.received')
  async handleIncomingMessage(msg: any) {
    try {
      const from = msg.key.remoteJid; // e.g. "5511999999999@s.whatsapp.net"
      if (from.includes('@g.us')) return; // Ignore groups

      const phone = from.split('@')[0];
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      if (!text) return;

      const pushName = msg.pushName || 'Cliente';

      await this.processMessage(phone, text.trim(), pushName);
    } catch (e) {
      this.logger.error('Error processing bot message', e);
    }
  }

  @OnEvent('appointment.paid')
  async handleAppointmentPaid(payload: { appointmentId: string }) {
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        include: { service: true, customer: true, barber: { include: { user: true } } }
      });
      if (!apt || !apt.customer.phone) return;

      const dateStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(apt.startDateTime));
      
      const msg = `✅ *Pagamento Confirmado!*\n\nSeu agendamento foi finalizado com sucesso.\n\n*Serviço:* ${apt.service.name}\n*Profissional:* ${apt.barber.user.firstName}\n*Data:* ${dateStr}\n\nTe esperamos lá!`;
      
      await this.whatsappService.sendMessage(apt.customer.phone, msg);
    } catch (e) {
      this.logger.error('Error sending payment confirmation', e);
    }
  }

  private async processMessage(phone: string, text: string, pushName: string) {
    // Basic logic to get Tenant. We'll pick the first tenant as this is usually single tenant per instance
    const tenant = await this.prisma.tenant.findFirst();
    if (!tenant) return;

    let session = await this.prisma.botSession.findUnique({ 
      where: { phone_tenantId: { phone, tenantId: tenant.id } } 
    });

    // Handle cancelation at any point
    if (text.toLowerCase() === 'cancelar' || text.toLowerCase() === 'sair') {
      if (session) {
        await this.prisma.botSession.delete({ where: { id: session.id } });
      }
      await this.whatsappService.sendMessage(phone, "Atendimento cancelado. Quando quiser agendar, basta mandar um 'Olá'!");
      return;
    }

    if (!session) {
      // New session
      session = await this.prisma.botSession.create({
        data: {
          phone,
          tenantId: tenant.id,
          step: 'START',
          customerName: pushName,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins to finish flow
        }
      });
      await this.sendGreeting(phone);
      return;
    }

    // Refresh expiry
    await this.prisma.botSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) }
    });

    switch (session.step) {
      case 'START':
        await this.handleStartStep(session, text);
        break;
      case 'CHOOSE_SERVICE':
        await this.handleChooseService(session, text);
        break;
      case 'CHOOSE_BARBER':
        await this.handleChooseBarber(session, text);
        break;
      case 'CHOOSE_DATE':
        await this.handleChooseDate(session, text);
        break;
      case 'CHOOSE_TIME':
        await this.handleChooseTime(session, text);
        break;
      case 'AWAITING_PAYMENT':
        await this.whatsappService.sendMessage(phone, "Seu horário está reservado! Realize o PIX enviado acima para confirmar, ou digite CANCELAR.");
        break;
      default:
        await this.whatsappService.sendMessage(phone, "Desculpe, não entendi. Vamos recomeçar? Digite 'Olá'.");
        await this.prisma.botSession.delete({ where: { id: session.id } });
        break;
    }
  }

  private async sendGreeting(phone: string) {
    const msg = `Olá! 👋 Bem-vindo ao atendimento automático da Barbearia.\n\nDeseja agendar um horário?\n\n*1* - Sim\n*2* - Não`;
    await this.whatsappService.sendMessage(phone, msg);
  }

  private async handleStartStep(session: any, text: string) {
    if (text === '1' || text.toLowerCase() === 'sim') {
      // List services
      const services = await this.prisma.service.findMany({
        where: { tenantId: session.tenantId, isActive: true, deletedAt: null },
        orderBy: { name: 'asc' }
      });
      
      if (services.length === 0) {
        await this.whatsappService.sendMessage(session.phone, "No momento não temos serviços disponíveis.");
        await this.prisma.botSession.delete({ where: { id: session.id } });
        return;
      }

      let msg = `Legal! Qual serviço você deseja agendar?\nResponda com o *número* correspondente:\n\n`;
      services.forEach((s, idx) => {
        msg += `*${idx + 1}* - ${s.name} (R$ ${s.price})\n`;
      });

      await this.prisma.botSession.update({
        where: { id: session.id },
        data: { step: 'CHOOSE_SERVICE' }
      });
      await this.whatsappService.sendMessage(session.phone, msg);
    } else {
      await this.whatsappService.sendMessage(session.phone, "Tudo bem! Qualquer coisa estamos à disposição.");
      await this.prisma.botSession.delete({ where: { id: session.id } });
    }
  }

  private async handleChooseService(session: any, text: string) {
    const idx = parseInt(text) - 1;
    const services = await this.prisma.service.findMany({
      where: { tenantId: session.tenantId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' }
    });

    if (isNaN(idx) || idx < 0 || idx >= services.length) {
      await this.whatsappService.sendMessage(session.phone, "Número inválido. Por favor, escolha um dos números da lista acima.");
      return;
    }

    const selectedService = services[idx];

    // Now list barbers
    const barbers = await this.prisma.barber.findMany({
      where: { tenantId: session.tenantId, isActive: true, deletedAt: null },
      include: { user: true }
    });

    if (barbers.length === 0) {
      await this.whatsappService.sendMessage(session.phone, "No momento não temos barbeiros disponíveis.");
      await this.prisma.botSession.delete({ where: { id: session.id } });
      return;
    }

    let msg = `Serviço *${selectedService.name}* escolhido!\nCom qual profissional você deseja ser atendido?\n\n`;
    barbers.forEach((b, i) => {
      msg += `*${i + 1}* - ${b.user.firstName} ${b.user.lastName}\n`;
    });
    msg += `*${barbers.length + 1}* - Qualquer Profissional`;

    await this.prisma.botSession.update({
      where: { id: session.id },
      data: { step: 'CHOOSE_BARBER', serviceId: selectedService.id }
    });
    await this.whatsappService.sendMessage(session.phone, msg);
  }

  private async handleChooseBarber(session: any, text: string) {
    const idx = parseInt(text) - 1;
    const barbers = await this.prisma.barber.findMany({
      where: { tenantId: session.tenantId, isActive: true, deletedAt: null },
      include: { user: true }
    });

    let selectedBarberId = null;
    
    if (idx === barbers.length) {
      // Qualquer profissional (pick first available later or just pick first for now)
      selectedBarberId = barbers[0].id;
    } else if (!isNaN(idx) && idx >= 0 && idx < barbers.length) {
      selectedBarberId = barbers[idx].id;
    } else {
      await this.whatsappService.sendMessage(session.phone, "Número inválido. Por favor, escolha um dos números da lista.");
      return;
    }

    await this.prisma.botSession.update({
      where: { id: session.id },
      data: { step: 'CHOOSE_DATE', barberId: selectedBarberId }
    });

    const msg = `Ótimo! Para qual *dia* você deseja?\n\nResponda no formato DD/MM.\nExemplo: *25/12* para 25 de Dezembro.`;
    await this.whatsappService.sendMessage(session.phone, msg);
  }

  private async handleChooseDate(session: any, text: string) {
    const match = text.match(/^(\d{2})[\/\-](\d{2})$/);
    if (!match) {
      await this.whatsappService.sendMessage(session.phone, "Formato inválido. Por favor, responda no formato DD/MM (ex: 25/12).");
      return;
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = new Date().getFullYear();
    
    // Quick validation
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      await this.whatsappService.sendMessage(session.phone, "Data inválida.");
      return;
    }

    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dateObj = new Date(`${dateStr}T00:00:00`);
    
    // Allow booking for today onwards
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dateObj < today) {
      await this.whatsappService.sendMessage(session.phone, "Não é possível agendar em datas passadas. Digite outra data (DD/MM).");
      return;
    }

    try {
      const times = await this.appointmentsService.getAvailability(session.barberId!, session.serviceId!, dateStr);
      
      if (!times || times.length === 0) {
        await this.whatsappService.sendMessage(session.phone, "Infelizmente não há horários disponíveis para este dia. Por favor, escolha outra data (DD/MM).");
        return;
      }

      let msg = `Horários disponíveis para *${text}*:\n\n`;
      times.forEach((t: string, i: number) => {
        msg += `*${i + 1}* - ${t}\n`;
      });

      await this.prisma.botSession.update({
        where: { id: session.id },
        data: { step: 'CHOOSE_TIME', selectedDate: dateStr }
      });
      await this.whatsappService.sendMessage(session.phone, msg);
    } catch (e: any) {
      await this.whatsappService.sendMessage(session.phone, "Erro ao buscar horários: " + e.message + "\nTente novamente com outra data.");
    }
  }

  private async handleChooseTime(session: any, text: string) {
    const idx = parseInt(text) - 1;
    
    // We need to fetch availability again to get the exact time string
    try {
      const times = await this.appointmentsService.getAvailability(session.barberId!, session.serviceId!, session.selectedDate!);

      if (isNaN(idx) || idx < 0 || idx >= times.length) {
        await this.whatsappService.sendMessage(session.phone, "Número inválido. Por favor, escolha um dos números da lista de horários.");
        return;
      }

      const selectedTime = times[idx]; // "14:30"
      
      // Get or Create Customer
      let customer = await this.prisma.user.findFirst({
        where: { phone: session.phone, tenantId: session.tenantId }
      });

      if (!customer) {
        customer = await this.prisma.user.create({
          data: {
            tenantId: session.tenantId,
            phone: session.phone,
            firstName: session.customerName?.split(' ')[0] || 'Convidado',
            lastName: session.customerName?.split(' ').slice(1).join(' ') || '',
            email: `zap_${session.phone}@barbearia.com`,
            passwordHash: 'NOPASSWORD',
            isActive: true
          }
        });
      }

      if (!customer.isActive) {
        await this.whatsappService.sendMessage(session.phone, "Sua conta está bloqueada no sistema. Por favor, entre em contato com a gerência.");
        await this.prisma.botSession.delete({ where: { id: session.id } });
        return;
      }

      // Create Appointment as PENDING
      const startDateTime = `${session.selectedDate}T${selectedTime}:00`;
      
      const apt = await this.appointmentsService.create(session.tenantId, customer.id, {
        barberId: session.barberId!,
        serviceId: session.serviceId!,
        startDateTime,
        fromBot: true
      }, false);

      const service = await this.prisma.service.findUnique({ where: { id: session.serviceId! } });
      const amount = Number(service?.price || 0);

      const externalRef = `apt_${apt.id}_${Date.now()}`;
      
      // Generate PIX
      const pix = await this.paymentsService.generatePix(
        amount, 
        `Agendamento ${service?.name}`, 
        customer.email, 
        externalRef
      );

      // Update Session
      await this.prisma.botSession.update({
        where: { id: session.id },
        data: { 
          step: 'AWAITING_PAYMENT',
          appointmentId: apt.id,
          paymentReference: externalRef
        }
      });

      const dateStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(apt.startDateTime));
      
      let msg = `Quase lá! Seu horário está reservado temporariamente por 10 minutos.\n\n`;
      msg += `*Resumo da Reserva:*\nData/Hora: ${dateStr}\nServiço: ${service?.name}\nValor: R$ ${amount.toFixed(2)}\n\n`;
      msg += `Para confirmar, pague o PIX Copia e Cola abaixo:\n\n`;
      
      await this.whatsappService.sendMessage(session.phone, msg);
      await this.whatsappService.sendMessage(session.phone, pix.qrCode); // Envia só o código pro cara copiar fácil
      
      // Removed the local setTimeout in favor of the global setInterval in OnModuleInit
      
    } catch (e: any) {
      await this.whatsappService.sendMessage(session.phone, "Erro ao tentar reservar o horário: " + e.message);
    }
  }
}
