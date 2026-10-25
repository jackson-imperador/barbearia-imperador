import { IsString, IsOptional } from 'class-validator';

export class MoveMediaDto {
  @IsString()
  @IsOptional()
  folderId?: string;
}
