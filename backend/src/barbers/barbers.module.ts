import { Module } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { BarbersController } from './barbers.controller';
import { BarberRepository } from './repositories/barbers.repository';
import { BarberProfileRepository } from './repositories/barber-profile.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { BarberProfileController } from './barber-profile.controller';
import { BarberProfileService } from './barber-profile.service';
import { BarberDashboardController } from './barber-dashboard.controller';
import { BarberDashboardService } from './barber-dashboard.service';
import { BarberDashboardRepository } from './repositories/barber-dashboard.repository';

@Module({
  imports: [PrismaModule],
  controllers: [
    BarbersController, 
    BarberProfileController,
    BarberDashboardController
  ],
  providers: [
    BarbersService,
    BarberProfileService,
    BarberProfileRepository,
    BarberDashboardService,
    BarberDashboardRepository,
    {
      provide: 'BARBER_REPOSITORY',
      useClass: BarberRepository,
    }
  ],
  exports: [BarbersService],
})
export class BarbersModule {}
