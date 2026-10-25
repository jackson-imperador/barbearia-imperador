import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString()
  @IsNotEmpty()
  newStartDateTime: string;
}
