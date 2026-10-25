import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ReorderItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ReorderDto {
  @IsArray()
  items: ReorderItemDto[];
}
