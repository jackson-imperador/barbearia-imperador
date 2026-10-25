import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AddPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class AwardAchievementDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  badgeUrl?: string;
}
