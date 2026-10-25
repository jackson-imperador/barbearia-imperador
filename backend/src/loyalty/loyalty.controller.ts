import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AddPointsDto, AwardAchievementDto } from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('my')
  async getMyLoyaltyInfo(@CurrentUser() user: any) {
    return this.loyaltyService.getLoyaltyInfo(user.sub);
  }

  @Post('add-points')
  @Roles('ADMIN', 'BARBER')
  async addPoints(@Body() addPointsDto: AddPointsDto, @CurrentUser() user: any) {
    return this.loyaltyService.addPoints(
      addPointsDto.userId,
      addPointsDto.points,
      user.tenantId,
      addPointsDto.reason,
    );
  }

  @Post('achievements')
  @Roles('ADMIN')
  async awardAchievement(@Body() awardAchievementDto: AwardAchievementDto) {
    return this.loyaltyService.awardAchievement(
      awardAchievementDto.userId,
      awardAchievementDto.title,
      awardAchievementDto.badgeUrl,
    );
  }
}
