import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
