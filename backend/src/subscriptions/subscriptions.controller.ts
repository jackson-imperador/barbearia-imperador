import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @Roles('CUSTOMER', 'VIP')
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserSubscription(user.sub);
  }

  @Post('subscribe')
  @Roles('CUSTOMER', 'VIP')
  async subscribe(@CurrentUser() user: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(user.sub, dto.plan);
  }

  @Delete('cancel')
  @Roles('CUSTOMER', 'VIP')
  async cancelSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.cancelSubscription(user.sub);
  }
}
