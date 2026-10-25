import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface IAppointmentRepository {
  findBarberFirst(where: Prisma.BarberWhereInput): Promise<any>;
  findServiceFirst(where: Prisma.ServiceWhereInput): Promise<any>;
  findServiceUnique(where: Prisma.ServiceWhereUniqueInput): Promise<any>;
  findUserFirst(where: Prisma.UserWhereInput): Promise<any>;
  findTenantFirst(): Promise<any>;
  findWorkingHourFirst(where: Prisma.WorkingHourWhereInput): Promise<any>;
  findDayOffFirst(where: Prisma.DayOffWhereInput): Promise<any>;
  findVacationFirst(where: Prisma.VacationWhereInput): Promise<any>;
  findBlockedPeriods(where: Prisma.BlockedPeriodWhereInput): Promise<any[]>;
  findAppointments(args: Prisma.AppointmentFindManyArgs): Promise<any[]>;
  countAppointments(where: Prisma.AppointmentWhereInput): Promise<number>;
  findAppointmentFirst(args: Prisma.AppointmentFindFirstArgs): Promise<any>;
  updateAppointment(args: Prisma.AppointmentUpdateArgs): Promise<any>;
  createAppointmentWithOverlapCheck(overlapWhere: Prisma.AppointmentWhereInput, data: Prisma.AppointmentCreateInput): Promise<any>;
  rescheduleAppointmentWithOverlapCheck(id: string, overlapWhere: Prisma.AppointmentWhereInput, newStart: Date, newEnd: Date): Promise<any>;
}

@Injectable()
export class AppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBarberFirst(where: Prisma.BarberWhereInput): Promise<any> {
    return this.prisma.barber.findFirst({ where });
  }

  async findServiceFirst(where: Prisma.ServiceWhereInput): Promise<any> {
    return this.prisma.service.findFirst({ where });
  }

  async findServiceUnique(where: Prisma.ServiceWhereUniqueInput): Promise<any> {
    return this.prisma.service.findUnique({ where });
  }

  async findUserFirst(where: Prisma.UserWhereInput): Promise<any> {
    return this.prisma.user.findFirst({ where });
  }

  async findTenantFirst(): Promise<any> {
    const adminRole = await this.prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (adminRole?.tenantId) {
      return this.prisma.tenant.findUnique({ where: { id: adminRole.tenantId } });
    }
    return this.prisma.tenant.findFirst();
  }

  async findWorkingHourFirst(where: Prisma.WorkingHourWhereInput): Promise<any> {
    return this.prisma.workingHour.findFirst({ where });
  }

  async findDayOffFirst(where: Prisma.DayOffWhereInput): Promise<any> {
    return this.prisma.dayOff.findFirst({ where });
  }

  async findVacationFirst(where: Prisma.VacationWhereInput): Promise<any> {
    return this.prisma.vacation.findFirst({ where });
  }

  async findBlockedPeriods(where: Prisma.BlockedPeriodWhereInput): Promise<any[]> {
    return this.prisma.blockedPeriod.findMany({ where });
  }

  async findAppointments(args: Prisma.AppointmentFindManyArgs): Promise<any[]> {
    return this.prisma.appointment.findMany(args);
  }

  async countAppointments(where: Prisma.AppointmentWhereInput): Promise<number> {
    return this.prisma.appointment.count({ where });
  }

  async findAppointmentFirst(args: Prisma.AppointmentFindFirstArgs): Promise<any> {
    return this.prisma.appointment.findFirst(args);
  }

  async updateAppointment(args: Prisma.AppointmentUpdateArgs): Promise<any> {
    return this.prisma.appointment.update(args);
  }

  async createAppointmentWithOverlapCheck(overlapWhere: Prisma.AppointmentWhereInput, data: Prisma.AppointmentCreateInput): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const overlap = await tx.appointment.findFirst({ where: overlapWhere });
      if (overlap) throw new ConflictException('Time slot is no longer available');
      return tx.appointment.create({ data });
    });
  }

  async rescheduleAppointmentWithOverlapCheck(id: string, overlapWhere: Prisma.AppointmentWhereInput, newStart: Date, newEnd: Date): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const overlap = await tx.appointment.findFirst({ where: overlapWhere });
      if (overlap) throw new ConflictException('Time slot is no longer available');
      return tx.appointment.update({
        where: { id },
        data: {
          startDateTime: newStart,
          endDateTime: newEnd,
          status: 'PENDING'
        },
      });
    });
  }
}

