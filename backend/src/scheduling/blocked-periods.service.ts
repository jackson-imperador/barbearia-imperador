import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';
import { UpdateBlockedPeriodDto } from './dto/update-blocked-period.dto';
import { BlockedPeriodQueryDto } from './dto/blocked-period-query.dto';
import { IBlockedPeriodsRepository, BLOCKED_PERIODS_REPOSITORY } from './repositories/blocked-periods.repository.interface';

@Injectable()
export class BlockedPeriodsService {
  constructor(
    @Inject(BLOCKED_PERIODS_REPOSITORY)
    private readonly repository: IBlockedPeriodsRepository,
  ) {}

  async create(tenantId: string, dto: CreateBlockedPeriodDto) {
    const barber = await this.repository.findBarber(dto.barberId, tenantId);
    if (!barber) throw new NotFoundException('Barber not found');

    const start = new Date(dto.startDateTime);
    const end = new Date(dto.endDateTime);

    if (start >= end) {
      throw new BadRequestException('startDateTime must be before endDateTime');
    }

    const overlapping = await this.repository.findOverlapping(
      tenantId,
      dto.barberId,
      start,
      end,
    );

    if (overlapping) {
      throw new ConflictException('Blocked period overlaps with an existing one.');
    }

    return this.repository.create({
      tenantId,
      barberId: dto.barberId,
      startDateTime: start,
      endDateTime: end,
      reason: dto.reason,
    });
  }

  async findAll(tenantId: string, query: BlockedPeriodQueryDto) {
    const { page = 1, limit = 50, barberId, from, to } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId,
      deletedAt: null,
    };

    if (barberId) whereClause.barberId = barberId;
    if (from || to) {
      whereClause.startDateTime = {};
      whereClause.endDateTime = {};
      if (from) whereClause.endDateTime.gte = new Date(from);
      if (to) whereClause.startDateTime.lte = new Date(to);
    }

    const [total, blocks] = await Promise.all([
      this.repository.count(whereClause),
      this.repository.findMany(
        whereClause,
        skip,
        limit,
        { startDateTime: 'asc' },
      ),
    ]);

    return {
      data: blocks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const block = await this.repository.findFirst({
      id,
      tenantId,
      deletedAt: null,
    });
    if (!block) throw new NotFoundException('Blocked period not found');
    return block;
  }

  async update(id: string, tenantId: string, dto: UpdateBlockedPeriodDto) {
    const block = await this.findOne(id, tenantId);

    const checkStart = dto.startDateTime ? new Date(dto.startDateTime) : block.startDateTime;
    const checkEnd = dto.endDateTime ? new Date(dto.endDateTime) : block.endDateTime;
    const checkBarberId = dto.barberId ?? block.barberId;

    if (checkStart >= checkEnd) {
      throw new BadRequestException('startDateTime must be before endDateTime');
    }

    if (dto.startDateTime || dto.endDateTime || dto.barberId) {
      const overlapping = await this.repository.findOverlapping(
        tenantId,
        checkBarberId,
        checkStart,
        checkEnd,
        id,
      );

      if (overlapping) {
        throw new ConflictException('Blocked period overlaps with an existing one.');
      }
    }

    return this.repository.update(id, {
      ...(dto.barberId && { barberId: dto.barberId }),
      ...(dto.startDateTime && { startDateTime: new Date(dto.startDateTime) }),
      ...(dto.endDateTime && { endDateTime: new Date(dto.endDateTime) }),
      ...(dto.reason !== undefined && { reason: dto.reason }),
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.repository.update(id, { deletedAt: new Date() });
  }
}
