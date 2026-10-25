import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDayOffDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
