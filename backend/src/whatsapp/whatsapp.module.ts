import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { BotService } from './bot.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AppointmentsModule, PaymentsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, BotService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
