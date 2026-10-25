import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ToggleBanDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  isActive?: boolean;
}
