import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, ConnectionState } from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private socket: any = null;
  private qrCodeStr: string | null = null;
  private connectionStatus: string = 'DISCONNECTED';
  private sessionDir = path.join(process.cwd(), 'whatsapp-auth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    this.logger.log('Inicializando WhatsApp Service (aguardando conexão manual via painel)...');
    if (fs.existsSync(this.sessionDir) && fs.readdirSync(this.sessionDir).length > 0) {
      this.logger.log('Sessão encontrada. Tentando reconectar...');
      await this.connect();
    }
  }

  async onModuleDestroy() {
    if (this.socket) {
      this.socket.ev.removeAllListeners();
      this.socket = null;
    }
  }

  async connect() {
    if (this.connectionStatus === 'CONNECTED') return;
    
    this.connectionStatus = 'CONNECTING';
    this.qrCodeStr = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('messages.upsert', async (m: any) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            if (!msg.key.fromMe && msg.message) {
              this.eventEmitter.emit('whatsapp.message.received', msg);
            }
          }
        }
      });

      this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          this.logger.log('Novo QR Code gerado.');
          this.qrCodeStr = await QRCode.toDataURL(qr);
          this.connectionStatus = 'WAITING_QR';
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.error(`Conexão fechada. Reconectando: ${shouldReconnect}`);
          this.connectionStatus = 'DISCONNECTED';
          this.qrCodeStr = null;
          
          if (shouldReconnect) {
            setTimeout(() => this.connect(), 5000);
          } else {
            this.clearSession();
          }
        } else if (connection === 'open') {
          this.logger.log('WhatsApp Conectado com Sucesso!');
          this.connectionStatus = 'CONNECTED';
          this.qrCodeStr = null;
        }
      });
    } catch (err) {
      this.logger.error('Erro ao inicializar WhatsApp', err);
      this.connectionStatus = 'ERROR';
    }
  }

  logout() {
    if (this.socket) {
      this.socket.logout();
    }
    this.clearSession();
    this.connectionStatus = 'DISCONNECTED';
    this.qrCodeStr = null;
  }

  private clearSession() {
    try {
      if (fs.existsSync(this.sessionDir)) {
        fs.rmSync(this.sessionDir, { recursive: true, force: true });
      }
    } catch (e) {
      this.logger.error('Erro ao limpar sessão', e);
    }
  }

  getStatus() {
    return {
      status: this.connectionStatus,
      qrCode: this.qrCodeStr
    };
  }

  async sendMessage(to: string, message: string) {
    if (this.connectionStatus !== 'CONNECTED' || !this.socket) {
      this.logger.warn(`WhatsApp não está conectado. Mensagem para ${to} ignorada.`);
      return false;
    }
    
    try {
      let formattedNumber = to.replace(/\D/g, '');
      if (formattedNumber.length === 11) {
        formattedNumber = `55${formattedNumber}`;
      } else if (formattedNumber.length === 10) {
        formattedNumber = `55${formattedNumber.substring(0, 2)}9${formattedNumber.substring(2)}`;
      }
      
      const jid = `${formattedNumber}@s.whatsapp.net`;
      await this.socket.sendMessage(jid, { text: message });
      this.logger.log(`Mensagem enviada para ${jid}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar mensagem para ${to}`, err);
      return false;
    }
  }

  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: any) {
    this.logger.log(`Evento: appointment.created -> ${payload.appointmentId}`);
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        include: { customer: true, barber: { include: { user: true } }, service: true }
      });
      const customer: any = apt?.customer;
      if (!apt || !customer?.phone) return;

      const dateStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(apt.startDateTime));
      
      const settings = await this.prisma.siteSettings.findUnique({
        where: { tenantId: apt.tenantId }
      });

      let msgClient = '';
      if (settings?.confirmationMessage) {
        msgClient = `${settings.confirmationMessage}\n\n*Detalhes:*\n🗓️ ${dateStr}\n✂️ ${apt.service.name}\n💈 Profissional: ${apt.barber.user.firstName}`;
      } else {
        msgClient = `Olá ${customer.firstName}! Seu agendamento de *${apt.service.name}* com ${apt.barber.user.firstName} foi confirmado para ${dateStr}. Te esperamos lá!`;
      }

      await this.sendMessage(customer.phone, msgClient);

      // NOTIFICAR O BARBEIRO (Regra Mestra SaaS)
      if (apt.barber?.user?.phone) {
        const msgBarber = `Novo agendamento recebido!\nCliente: ${customer.firstName}\nServiço: ${apt.service.name}\nData: ${dateStr}`;
        await this.sendMessage(apt.barber.user.phone, msgBarber);
      }
    } catch (e) {
      this.logger.error('Erro ao enviar whatsapp no agendamento', e);
    }
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: any) {
    this.logger.log(`Evento: appointment.cancelled -> ${payload.appointmentId}`);
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        include: { customer: true, barber: { include: { user: true } }, service: true }
      });
      const customer: any = apt.customer;
      if (!apt || !customer?.phone) return;

      const dateStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(apt.startDateTime));
      
      let msg = '';
      if (payload.cancelledBy === 'OWNER') {
        msg = `Olá ${customer.firstName}. Infelizmente tivemos um imprevisto e seu horário de *${apt.service.name}* no dia ${dateStr} precisou ser desmarcado. Pedimos desculpas pelo transtorno e pedimos que agende um novo horário!`;
      } else {
        msg = `Olá ${customer.firstName}. Confirmamos o cancelamento do seu agendamento de *${apt.service.name}* no dia ${dateStr}.`;
      }
      
      await this.sendMessage(customer.phone, msg);
    } catch (e) {
      this.logger.error('Erro ao enviar whatsapp no cancelamento', e);
    }
  }
}
