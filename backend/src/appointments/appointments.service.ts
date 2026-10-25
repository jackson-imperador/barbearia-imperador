import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAppointmentRepository } from './repositories/appointments.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject('APPOINTMENT_REPOSITORY') private readonly appointmentRepository: IAppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getBarberIdFromUserId(userId: string, tenantId: string): Promise<string | undefined> {
    const barber = await this.prisma.barber.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });
    return barber?.id;
  }

  async create(tenantId: string, customerId: string, dto: CreateAppointmentDto, isAdmin: boolean) {
    const finalCustomerId = isAdmin && dto.customerId ? dto.customerId : customerId;

    const [barber, service, customer] = await Promise.all([
      this.appointmentRepository.findBarberFirst({ id: dto.barberId, tenantId, isActive: true, deletedAt: null }),
      this.appointmentRepository.findServiceFirst({ id: dto.serviceId, tenantId, isActive: true, deletedAt: null }),
      this.appointmentRepository.findUserFirst({ id: finalCustomerId, tenantId, deletedAt: null }),
    ]);

    if (!barber) throw new NotFoundException('Barber not found or inactive');
    if (!service) throw new NotFoundException('Service not found or inactive');
    if (!customer) throw new NotFoundException('Customer not found');

    if ((service as any).disabledByBarberIds?.includes(barber.id)) {
      throw new ForbiddenException('Este serviço não está disponível para o barbeiro selecionado.');
    }

    const userDb = await this.prisma.user.findUnique({
      where: { id: finalCustomerId },
      include: { subscription: true }
    });

    if (userDb && userDb.subscription && userDb.subscription.endDate && userDb.subscription.endDate < new Date()) {
      if (!userDb.isManualBan && userDb.isActive) {
        await this.prisma.user.update({
          where: { id: finalCustomerId },
          data: { isActive: false }
        });
        userDb.isActive = false;
      }
    }
    
    if (userDb && !userDb.isActive) {
      throw new ForbiddenException('Cliente bloqueado. Entre em contato com a barbearia.');
    }
    
    if (userDb?.subscription && !userDb.subscription.isActive) {
      throw new ForbiddenException('Você possui pagamentos pendentes (Assinatura VIP). Por favor, pague o PIX ou aguarde a compensação antes de agendar novos cortes.');
    }

    const start = new Date(dto.startDateTime);
    if (start < new Date()) throw new BadRequestException('Cannot book in the past');

    const end = new Date(start.getTime() + service.duration * 60000);

    await this.validateAvailability(tenantId, dto.barberId, start, end);

    const overlapWhere = {
      tenantId,
      barberId: dto.barberId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      deletedAt: null,
      OR: [
        { startDateTime: { lt: end }, endDateTime: { gt: start } },
      ],
    };

    const newApt = await this.appointmentRepository.createAppointmentWithOverlapCheck(overlapWhere as any, {
      tenant: { connect: { id: tenantId } },
      customer: { connect: { id: finalCustomerId } },
      barber: { connect: { id: dto.barberId } },
      service: { connect: { id: dto.serviceId } },
      startDateTime: start,
      endDateTime: end,
      notes: dto.notes,
    });

    if (!dto.fromBot) {
      this.eventEmitter.emit('appointment.created', {
        appointmentId: newApt.id,
        tenantId
      });
    }

    return newApt;
  }

  async getAvailability(barberId: string, serviceId: string, dateStr: string) {
    if (!barberId || !serviceId || !dateStr) {
      throw new BadRequestException('barberId, serviceId and date are required');
    }

    const tenant = await this.appointmentRepository.findTenantFirst();
    if (!tenant) throw new NotFoundException('System not configured');
    const tenantId = tenant.id;

    const [barber, service] = await Promise.all([
      this.appointmentRepository.findBarberFirst({ id: barberId, tenantId, isActive: true, deletedAt: null }),
      this.appointmentRepository.findServiceFirst({ id: serviceId, tenantId, isActive: true, deletedAt: null })
    ]);

    if (!barber || !service) throw new NotFoundException('Barber or Service not found');
    
    // Check if the service was disabled specifically by this barber
    if ((service as any).disabledByBarberIds?.includes(barberId)) {
      return []; // Not available
    }

    const targetDate = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = targetDate.getDay();

    const workingHour = await this.appointmentRepository.findWorkingHourFirst({
      barberId, dayOfWeek, isWorkingDay: true
    });

    if (!workingHour) return []; 

    const dayOff = await this.appointmentRepository.findDayOffFirst({
      barberId, date: new Date(dateStr)
    });
    if (dayOff) return [];

    const vacation = await this.appointmentRepository.findVacationFirst({
      barberId, startDate: { lte: targetDate }, endDate: { gte: targetDate }
    });
    if (vacation) return [];

    const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);

    const blockedPeriods = await this.appointmentRepository.findBlockedPeriods({
      barberId, tenantId, deletedAt: null, startDateTime: { gte: startOfDay }, endDateTime: { lte: endOfDay }
    });

    const appointments = await this.appointmentRepository.findAppointments({
      where: { barberId, tenantId, deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] }, startDateTime: { gte: startOfDay, lte: endOfDay } }
    });

    console.log('appointments length:', appointments.length, 'blockedPeriods:', blockedPeriods.length); const availableSlots: string[] = [];
    const [startH, startM] = workingHour.startTime.split(':').map(Number);
    const [endH, endM] = workingHour.endTime.split(':').map(Number);
    
    console.log('WORKING HOUR:', workingHour); let currentSlot = new Date(targetDate);
    currentSlot.setHours(startH, startM, 0, 0);

    const endOfShift = new Date(targetDate);
    endOfShift.setHours(endH, endM, 0, 0);

    const now = new Date();

    while (currentSlot < endOfShift) {
      const slotEnd = new Date(currentSlot.getTime() + service.duration * 60000);

      if (currentSlot > now && slotEnd <= endOfShift) {
        const isBlocked = blockedPeriods.some(b => 
          (currentSlot < b.endDateTime && slotEnd > b.startDateTime)
        );

        const isBooked = appointments.some(a => 
          (currentSlot < a.endDateTime && slotEnd > a.startDateTime)
        );

        if (!isBlocked && !isBooked) {
          const hh = currentSlot.getHours().toString().padStart(2, '0');
          const mm = currentSlot.getMinutes().toString().padStart(2, '0');
          availableSlots.push(`${hh}:${mm}`);
        }
      }
      
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    return availableSlots;
  }

  private async validateAvailability(tenantId: string, barberId: string, start: Date, end: Date) {
    const blocked = await this.appointmentRepository.findBlockedPeriods({
      tenantId, barberId, deletedAt: null,
      OR: [
        { startDateTime: { lt: end }, endDateTime: { gt: start } }
      ]
    });
    if (blocked && blocked.length > 0) throw new ConflictException('Time period is blocked');

    const dayOff = await this.appointmentRepository.findDayOffFirst({
      barberId,
      date: new Date(start.toISOString().split('T')[0]),
    });
    if (dayOff) throw new ConflictException('Barber has a day off on this date');

    const vacation = await this.appointmentRepository.findVacationFirst({
      barberId,
      startDate: { lte: start },
      endDate: { gte: start },
    });
    if (vacation) throw new ConflictException('Barber is on vacation');
  }

  async findAll(tenantId: string, query: AppointmentQueryDto, userId?: string, isCustomer?: boolean, resolvedBarberId?: string) {
    const { page = 1, limit = 50, barberId, customerId, status, from, to } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = { tenantId, deletedAt: null };

    if (isCustomer) {
      whereClause.customerId = userId;
    } else {
      if (customerId) whereClause.customerId = customerId;
      if (resolvedBarberId) {
        whereClause.barberId = resolvedBarberId;
      }
    }
    
    // If client requested a specific barberId (and they're allowed or they're a customer filtering), apply it
    // But if they are a barber, they are ALREADY restricted to their own by `resolvedBarberId` above, 
    // so `query.barberId` would either match or return nothing.
    if (barberId) whereClause.barberId = barberId;
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.startDateTime = {};
      if (from) whereClause.startDateTime.gte = new Date(from);
      if (to) whereClause.startDateTime.lte = new Date(to);
    }

    const [total, appointments] = await Promise.all([
      this.appointmentRepository.countAppointments(whereClause),
      this.appointmentRepository.findAppointments({
        where: whereClause,
        skip, take: limit,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          barber: { include: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { name: true, duration: true, price: true } },
        },
        orderBy: [
          // If not customer, sort PENDING first. Wait, Prisma doesn't support complex order by status easily.
          // Wait, Prisma CANNOT sort by specific enum values in a simple orderBy unless we map it.
          // Since the user wants PENDING at the top and newest first, we will fetch and sort in memory if not customer,
          // or we can just sort by startDateTime desc.
          // Wait, Prisma can sort by createdAt desc.
          { createdAt: 'desc' }
        ]
      })
    ]);

    // In-memory sort to prioritize PENDING if Admin
    let sortedAppointments = appointments;
    if (!isCustomer) {
      sortedAppointments = appointments.sort((a: any, b: any) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        // Within PENDING, newest first. Within others, by startDateTime or createdAt.
        // We'll just use createdAt to ensure newest is at the top.
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      sortedAppointments = appointments.sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    }

    return {
      data: sortedAppointments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getUnreadCount(tenantId: string) {
    const count = await this.prisma.appointment.count({
      where: {
        tenantId,
        status: 'PENDING',
        isViewed: false,
        deletedAt: null
      }
    });
    return { count };
  }

  async markViewed(tenantId: string) {
    const result = await this.prisma.appointment.updateMany({
      where: {
        tenantId,
        status: 'PENDING',
        isViewed: false,
        deletedAt: null
      },
      data: {
        isViewed: true
      }
    });
    return { success: true, updatedCount: result.count };
  }

  async findOne(id: string, tenantId: string, userId: string, isCustomer: boolean, resolvedBarberId?: string) {
    const appointment = await this.appointmentRepository.findAppointmentFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        barber: { include: { user: { select: { firstName: true, lastName: true } } } },
        service: true,
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    if (isCustomer && appointment.customerId !== userId) throw new ForbiddenException('Access denied');
    if (resolvedBarberId && appointment.barberId !== resolvedBarberId) throw new ForbiddenException('Acesso negado: Este agendamento pertence a outro barbeiro.');

    return appointment;
  }

  async updateStatus(id: string, tenantId: string, status: AppointmentStatus, userId: string, isCustomer: boolean, reason?: string, resolvedBarberId?: string) {
    const appointment = await this.findOne(id, tenantId, userId, isCustomer, resolvedBarberId);

    if (isCustomer && status !== 'CANCELLED') {
      throw new ForbiddenException('Customers can only cancel appointments');
    }

    const updateData: any = { status };
    if (reason) updateData.cancellationReason = reason;

    // If completing the appointment, capture the value paid to reflect in Dashboard and CRM LTV
    if (status === 'COMPLETED' && appointment.service) {
      updateData.amountPaid = appointment.service.price;
    }

    const updated = await this.appointmentRepository.updateAppointment({
      where: { id },
      data: updateData,
    });

    // Idempotent financial transaction creation
    if (status === 'COMPLETED') {
      const existingTx = await this.prisma.financialTransaction.findUnique({
        where: { appointmentId: id }
      });
      if (!existingTx && appointment.service) {
        await this.prisma.financialTransaction.create({
          data: {
            tenantId,
            amount: Number(appointment.service.price),
            type: 'INCOME',
            paymentMethod: 'CASH', // default
            description: `Serviço: ${appointment.service.name}`,
            appointmentId: id
          }
        });
      }
    }

    if (status === 'CANCELLED') {
      this.eventEmitter.emit('appointment.cancelled', {
        appointmentId: id,
        tenantId,
        cancelledBy: isCustomer ? 'CUSTOMER' : 'OWNER',
        reason
      });
    }

    return updated;
  }

  async reschedule(id: string, tenantId: string, dto: RescheduleAppointmentDto, userId: string, isCustomer: boolean, resolvedBarberId?: string) {
    const appointment = await this.findOne(id, tenantId, userId, isCustomer, resolvedBarberId);

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reschedule a cancelled or completed appointment');
    }

    const service = await this.appointmentRepository.findServiceUnique({ id: appointment.serviceId });
    const start = new Date(dto.newStartDateTime);
    if (start < new Date()) throw new BadRequestException('Cannot book in the past');
    const end = new Date(start.getTime() + service.duration * 60000);

    await this.validateAvailability(tenantId, appointment.barberId, start, end);

    const overlapWhere = {
      id: { not: id },
      tenantId,
      barberId: appointment.barberId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      deletedAt: null,
      OR: [
        { startDateTime: { lt: end }, endDateTime: { gt: start } },
      ],
    };

    return this.appointmentRepository.rescheduleAppointmentWithOverlapCheck(id, overlapWhere as any, start, end);
  }

  async remove(id: string, tenantId: string) {
    const appointment = await this.appointmentRepository.findAppointmentFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    return this.appointmentRepository.updateAppointment({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- Agendamento Inteligente ---

  async addReminder(appointmentId: string, type: string) {
    const appointment = await this.appointmentRepository.findAppointmentFirst({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return this.prisma.appointmentReminder.create({
      data: {
        appointmentId,
        type,
      }
    });
  }

  async addFavorite(userId: string, serviceId: string, barberId: string, name: string) {
    return this.prisma.appointmentFavorite.create({
      data: {
        userId,
        serviceId,
        barberId,
        name
      }
    });
  }

  async getFavorites(userId: string) {
    return this.prisma.appointmentFavorite.findMany({
      where: { userId },
      include: {
        service: true,
        barber: { include: { user: true } }
      }
    });
  }

  async createPackage(tenantId: string, name: string, price: number, servicesCount: number) {
    return this.prisma.appointmentPackage.create({
      data: {
        tenantId,
        name,
        price,
        servicesCount
      }
    });
  }

  async getPackages(tenantId: string) {
    return this.prisma.appointmentPackage.findMany({
      where: { tenantId, isActive: true }
    });
  }

  async repeatLastCut(userId: string, tenantId: string) {
    const lastAppointment = await this.appointmentRepository.findAppointmentFirst({
      where: { customerId: userId, tenantId, status: 'COMPLETED' },
      orderBy: { startDateTime: 'desc' },
      include: {
        barber: true,
        service: true
      }
    });

    if (!lastAppointment) {
      throw new NotFoundException('No previous appointment found to repeat');
    }

    return lastAppointment;
  }

  async getSuggestions(userId: string, tenantId: string) {
    const lastAppointment = await this.appointmentRepository.findAppointmentFirst({
      where: { customerId: userId, tenantId, status: 'COMPLETED' },
      orderBy: { startDateTime: 'desc' },
      include: {
        barber: true,
        service: true
      }
    });

    if (!lastAppointment) {
      return { suggestions: [], message: 'No history found' };
    }

    const estimatedTime = lastAppointment.service.duration;
    const suggestedDate = new Date(lastAppointment.startDateTime);
    suggestedDate.setDate(suggestedDate.getDate() + 15); // Suggest 15 days after last appointment

    return {
      suggestedService: lastAppointment.service,
      suggestedBarber: lastAppointment.barber,
      estimatedTime,
      suggestedDate,
      message: 'Based on your history, we suggest this time.',
    };
  }
}






