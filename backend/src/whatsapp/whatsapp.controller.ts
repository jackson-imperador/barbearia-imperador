import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'SUPER_ADMIN', 'ADMIN') // Apenas o dono ou admins podem gerenciar a conexão do WhatsApp
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('connect')
  async connect() {
    await this.whatsappService.connect();
    return { message: 'Iniciando conexão' };
  }

  @Post('logout')
  logout() {
    this.whatsappService.logout();
    return { message: 'Desconectado com sucesso' };
  }
}
