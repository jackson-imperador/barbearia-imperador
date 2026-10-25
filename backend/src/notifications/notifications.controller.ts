import {
  Controller, Get, Patch, Param, Req, Res, UseGuards, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // SSE — stream de eventos em tempo real
  @Get('stream')
  async stream(@CurrentUser() user: any, @Req() req: Request, @Res() res: Response) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      res.status(401).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Envia ping inicial
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    const callback = (data: string) => {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (e) {}
    };

    this.notificationsService.subscribe(userId, callback);

    // Keep-alive a cada 25s
    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (e) {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      this.notificationsService.unsubscribe(userId, callback);
    });
  }

  // Busca todas as notificações
  @Get()
  async getAll(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    return this.notificationsService.getAll(userId);
  }

  // Busca não lidas
  @Get('unread')
  async getUnread(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    return this.notificationsService.getUnread(userId);
  }

  // Marca todas como lidas
  @Patch('read-all')
  async markAllRead(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    return this.notificationsService.markAllRead(userId);
  }

  // Marca uma como lida
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    return this.notificationsService.markRead(id, userId);
  }
}
