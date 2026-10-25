import { IsString, IsNotEmpty } from 'class-validator';

export class ToggleFavoriteDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
