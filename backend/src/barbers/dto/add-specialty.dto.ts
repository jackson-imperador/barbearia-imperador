import { IsString, IsNotEmpty } from 'class-validator';

export class AddSpecialtyDto {
  @IsString()
  @IsNotEmpty()
  specialty: string;
}
