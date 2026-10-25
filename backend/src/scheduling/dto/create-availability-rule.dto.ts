import { IsInt, Min, Max, IsString, Matches, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAvailabilityRuleDto {
  @IsString()
  @IsNotEmpty()
  barberId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  weekDay: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsInt()
  @Min(5)
  slotInterval: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
