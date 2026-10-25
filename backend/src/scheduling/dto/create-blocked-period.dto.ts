import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateBlockedPeriodDto {
  @IsString()
  @IsNotEmpty()
  barberId: string;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
