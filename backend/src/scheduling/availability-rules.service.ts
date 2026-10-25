import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { AvailabilityRuleQueryDto } from './dto/availability-rule-query.dto';
import { IAvailabilityRulesRepository, AVAILABILITY_RULES_REPOSITORY } from './repositories/availability-rules.repository.interface';

@Injectable()
export class AvailabilityRulesService {
  constructor(
    @Inject(AVAILABILITY_RULES_REPOSITORY)
    private readonly repository: IAvailabilityRulesRepository,
  ) {}

  async create(tenantId: string, dto: CreateAvailabilityRuleDto) {
    const barber = await this.repository.findBarber(dto.barberId, tenantId);
    if (!barber) throw new NotFoundException('Barber not found');

    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const overlapping = await this.repository.findOverlapping(
      tenantId,
      dto.barberId,
      dto.weekDay,
      dto.startTime,
      dto.endTime,
    );

    if (overlapping) {
      throw new ConflictException('Availability rule overlaps with an existing one for this day.');
    }

    return this.repository.create({
      tenantId,
      ...dto,
    });
  }

  async findAll(tenantId: string, query: AvailabilityRuleQueryDto) {
    const { page = 1, limit = 50, barberId, weekDay, isActive } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId,
      deletedAt: null,
    };

    if (barberId) whereClause.barberId = barberId;
    if (weekDay !== undefined) whereClause.weekDay = weekDay;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [total, rules] = await Promise.all([
      this.repository.count(whereClause),
      this.repository.findMany(
        whereClause,
        skip,
        limit,
        [{ weekDay: 'asc' }, { startTime: 'asc' }],
      ),
    ]);

    return {
      data: rules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const rule = await this.repository.findFirst({
      id,
      tenantId,
      deletedAt: null,
    });
    if (!rule) throw new NotFoundException('Availability rule not found');
    return rule;
  }

  async update(id: string, tenantId: string, dto: UpdateAvailabilityRuleDto) {
    const rule = await this.findOne(id, tenantId);

    const checkStartTime = dto.startTime ?? rule.startTime;
    const checkEndTime = dto.endTime ?? rule.endTime;
    const checkWeekDay = dto.weekDay ?? rule.weekDay;
    const checkBarberId = dto.barberId ?? rule.barberId;

    if (checkStartTime >= checkEndTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    if (dto.startTime || dto.endTime || dto.weekDay || dto.barberId) {
      const overlapping = await this.repository.findOverlapping(
        tenantId,
        checkBarberId,
        checkWeekDay,
        checkStartTime,
        checkEndTime,
        id,
      );

      if (overlapping) {
        throw new ConflictException('Availability rule overlaps with an existing one.');
      }
    }

    return this.repository.update(id, dto);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.repository.update(id, { deletedAt: new Date(), isActive: false });
  }
}
