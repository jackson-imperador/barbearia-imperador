import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddPortfolioDto {
  @IsString()
  @IsNotEmpty()
  mediaId: string;

  @IsString()
  @IsOptional()
  description?: string;
}
