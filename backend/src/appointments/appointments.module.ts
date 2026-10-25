import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentRepository } from './repositories/appointments.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    {
      provide: 'APPOINTMENT_REPOSITORY',
      useClass: AppointmentRepository,
    }
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
