import { IsString, IsNotEmpty } from 'class-validator';

export class ManualUpdateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  plan: string;
}
