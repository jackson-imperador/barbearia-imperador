import { Controller, ForbiddenException, Req, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BarberProfileService } from './barber-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AddPortfolioDto } from './dto/add-portfolio.dto';
import { AddReviewDto } from './dto/add-review.dto';
import { AddSpecialtyDto } from './dto/add-specialty.dto';

@Controller('barbers/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarberProfileController {
  constructor(private readonly barberProfileService: BarberProfileService, private readonly prisma: PrismaService) {}

  private async checkBarberIdentity(req: any, targetBarberId: string) {
    const roles = req.user?.roles || [];
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return; // Admins can edit
    }
    if (roles.includes('BARBER')) {
      const tenantId = req.user.tenantId || req.user.tenant || '1';
      const userId = req.user?.id || req.user?.sub;
      const barber = await this.prisma.barber.findFirst({
        where: { userId: userId, tenantId, deletedAt: null }
      });
      if (!barber || barber.id !== targetBarberId) {
        throw new ForbiddenException('Acesso negado: Você só pode editar o seu próprio perfil profissional.');
      }
    }
  }

  @Get(':barberId')
  async getProfile(@Param('barberId') barberId: string) {
    return this.barberProfileService.getProfile(barberId);
  }

  @Post(':barberId/portfolio')
  @Roles('BARBER', 'ADMIN')
  async addPortfolio(@Param('barberId') barberId: string, @Body() dto: AddPortfolioDto, @Req() req: any) {
    await this.checkBarberIdentity(req, barberId);
    return this.barberProfileService.addPortfolio(barberId, dto.mediaId, dto.description);
  }

  @Post(':barberId/reviews')
  async addReview(@Param('barberId') barberId: string, @Body() dto: AddReviewDto, @CurrentUser() user: any) {
    return this.barberProfileService.addReview(barberId, user.sub, dto.rating, dto.comment);
  }

  @Post(':barberId/follow')
  async followBarber(@Param('barberId') barberId: string, @CurrentUser() user: any) {
    return this.barberProfileService.followBarber(barberId, user.sub);
  }

  @Delete(':barberId/follow')
  async unfollowBarber(@Param('barberId') barberId: string, @CurrentUser() user: any) {
    return this.barberProfileService.unfollowBarber(barberId, user.sub);
  }

  @Post(':barberId/specialties')
  @Roles('BARBER', 'ADMIN')
  async addSpecialty(@Param('barberId') barberId: string, @Body() dto: AddSpecialtyDto, @Req() req: any) {
    await this.checkBarberIdentity(req, barberId);
    return this.barberProfileService.addSpecialty(barberId, dto.specialty);
  }
}
