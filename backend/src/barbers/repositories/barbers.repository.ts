import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface IBarberRepository {
  findUser(where: Prisma.UserWhereInput): Promise<any>;
  findBarberByUserId(userId: string): Promise<any>;
  createBarber(args: Prisma.BarberCreateArgs): Promise<any>;
  countBarbers(where: Prisma.BarberWhereInput): Promise<number>;
  findBarbers(args: Prisma.BarberFindManyArgs): Promise<any[]>;
  findBarberFirst(args: Prisma.BarberFindFirstArgs): Promise<any>;
  updateBarber(args: Prisma.BarberUpdateArgs): Promise<any>;
  upsertWorkingHour(args: Prisma.WorkingHourUpsertArgs): Promise<any>;
  upsertDayOff(args: Prisma.DayOffUpsertArgs): Promise<any>;
  deleteDayOffs(args: Prisma.DayOffDeleteManyArgs): Promise<any>;
  createVacation(args: Prisma.VacationCreateArgs): Promise<any>;
  deleteVacations(args: Prisma.VacationDeleteManyArgs): Promise<any>;
}

@Injectable()
export class BarberRepository implements IBarberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(where: Prisma.UserWhereInput): Promise<any> {
    return this.prisma.user.findFirst({ where });
  }

  async findBarberByUserId(userId: string): Promise<any> {
    return this.prisma.barber.findUnique({ where: { userId } });
  }

  async createBarber(args: Prisma.BarberCreateArgs): Promise<any> {
    return this.prisma.barber.create(args);
  }

  async countBarbers(where: Prisma.BarberWhereInput): Promise<number> {
    return this.prisma.barber.count({ where });
  }

  async findBarbers(args: Prisma.BarberFindManyArgs): Promise<any[]> {
    return this.prisma.barber.findMany(args);
  }

  async findBarberFirst(args: Prisma.BarberFindFirstArgs): Promise<any> {
    return this.prisma.barber.findFirst(args);
  }

  async updateBarber(args: Prisma.BarberUpdateArgs): Promise<any> {
    return this.prisma.barber.update(args);
  }

  async upsertWorkingHour(args: Prisma.WorkingHourUpsertArgs): Promise<any> {
    return this.prisma.workingHour.upsert(args);
  }

  async upsertDayOff(args: Prisma.DayOffUpsertArgs): Promise<any> {
    return this.prisma.dayOff.upsert(args);
  }

  async deleteDayOffs(args: Prisma.DayOffDeleteManyArgs): Promise<any> {
    return this.prisma.dayOff.deleteMany(args);
  }

  async createVacation(args: Prisma.VacationCreateArgs): Promise<any> {
    return this.prisma.vacation.create(args);
  }

  async deleteVacations(args: Prisma.VacationDeleteManyArgs): Promise<any> {
    return this.prisma.vacation.deleteMany(args);
  }
}
