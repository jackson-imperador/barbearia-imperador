import { IsString, IsNotEmpty } from 'class-validator';

export class RenameMediaDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
