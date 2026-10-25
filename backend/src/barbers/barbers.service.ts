import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { IBarberRepository } from './repositories/barbers.repository';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { BarberQueryDto } from './dto/barber-query.dto';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { CreateDayOffDto } from './dto/create-day-off.dto';
import { CreateVacationDto } from './dto/create-vacation.dto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BarbersService {
  constructor(
    @Inject('BARBER_REPOSITORY') private readonly barberRepository: IBarberRepository,
    private readonly prisma: PrismaService
  ) {}

  async getDefaultTenantId(): Promise<string> {
    const adminRole = await this.prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (adminRole?.tenantId) return adminRole.tenantId;
    const tenant = await this.prisma.tenant.findFirst();
    return tenant?.id || '';
  }

  async create(tenantId: string, dto: CreateBarberDto) {
    const user = await this.barberRepository.findUser({
      id: dto.userId, tenantId, deletedAt: null
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    const existingBarber = await this.barberRepository.findBarberByUserId(dto.userId);

    if (existingBarber) {
      throw new ConflictException('Barber profile already exists for this user');
    }

    return this.barberRepository.createBarber({
      data: {
        userId: dto.userId,
        tenantId,
        bio: dto.bio,
        isActive: dto.isActive ?? true,
      },
      include: { user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } } },
    });
  }

  async findAll(tenantId: string, query: BarberQueryDto, isCustomer: boolean = false) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId,
      deletedAt: null,
    };

    if (isCustomer) {
      whereClause.isActive = true;
    } else if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search) {
      whereClause.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, barbers] = await Promise.all([
      this.barberRepository.countBarbers(whereClause),
      this.barberRepository.findBarbers({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: barbers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string, isCustomer: boolean = false) {
    const whereClause: any = { id, tenantId, deletedAt: null };
    if (isCustomer) {
      whereClause.isActive = true;
    }

    const barber = await this.barberRepository.findBarberFirst({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        workingHours: true,
        daysOff: true,
        vacations: true,
      },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    return barber;
  }

  async update(id: string, tenantId: string, dto: UpdateBarberDto) {
    await this.findOne(id, tenantId);

    return this.barberRepository.updateBarber({
      where: { id },
      data: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    
    await this.barberRepository.updateBarber({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Barber profile deleted successfully' };
  }

  async uploadPhoto(id: string, tenantId: string, fileData: any) {
    await this.findOne(id, tenantId);
    return { message: 'Photo uploaded successfully', url: 'https://example.com/photo.jpg' };
  }

  async setWorkingHour(barberId: string, tenantId: string, dto: CreateWorkingHourDto) {
    await this.findOne(barberId, tenantId);

    return this.barberRepository.upsertWorkingHour({
      where: {
        barberId_dayOfWeek: { barberId, dayOfWeek: dto.dayOfWeek },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        isWorkingDay: dto.isWorkingDay ?? true,
      },
      create: {
        barberId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isWorkingDay: dto.isWorkingDay ?? true,
      },
    });
  }

  async addDayOff(barberId: string, tenantId: string, dto: CreateDayOffDto) {
    await this.findOne(barberId, tenantId);

    return this.barberRepository.upsertDayOff({
      where: {
        barberId_date: { barberId, date: new Date(dto.date) },
      },
      update: {
        reason: dto.reason,
      },
      create: {
        barberId,
        date: new Date(dto.date),
        reason: dto.reason,
      },
    });
  }

  async removeDayOff(barberId: string, tenantId: string, dayOffId: string) {
    await this.findOne(barberId, tenantId);
    await this.barberRepository.deleteDayOffs({
      where: { id: dayOffId, barberId },
    });
    return { message: 'Day off removed' };
  }

  async addVacation(barberId: string, tenantId: string, dto: CreateVacationDto) {
    await this.findOne(barberId, tenantId);

    return this.barberRepository.createVacation({
      data: {
        barberId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });
  }

  async removeVacation(barberId: string, tenantId: string, vacationId: string) {
    await this.findOne(barberId, tenantId);
    await this.barberRepository.deleteVacations({
      where: { id: vacationId, barberId },
    });
    return { message: 'Vacation removed' };
  }
}

