import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateVacationDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
