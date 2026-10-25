import { IsNumber, IsString, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class AddReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
