import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockedPeriodDto } from './create-blocked-period.dto';

export class UpdateBlockedPeriodDto extends PartialType(CreateBlockedPeriodDto) {}
