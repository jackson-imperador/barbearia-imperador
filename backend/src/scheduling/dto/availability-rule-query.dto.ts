import { IsOptional, IsInt, Min, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityRuleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  barberId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weekDay?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
