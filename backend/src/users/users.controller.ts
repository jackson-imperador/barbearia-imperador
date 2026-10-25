import { Controller, Get, Put, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BaseController } from '../common/controllers/base.controller';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'SUPER_ADMIN', 'ADMIN')
export class UsersController extends BaseController<any, CreateUserDto, UpdateUserDto> {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService
  ) {
    super(usersService as any, ['firstName', 'lastName', 'email']);
  }

  // Profile endpoint doesn't require OWNER role, so we override role protection here
  @Get('profile')
  @Roles('OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.sub);
  }

  @Get('admins')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN')
  async getAdmins(@CurrentUser() user: any) {
    // Busca na loja (tenant) atual
    let tenantId = user?.tenantId || user?.tenant;
    return this.usersService.getAdmins(tenantId);
  }

  @Post('admins')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN')
  async createAdmin(@CurrentUser() user: any, @Body() body: any) {
    let tenantId = user?.tenantId || user?.tenant;
    return this.usersService.createAdmin(tenantId, body);
  }

  @Delete('admins/:id')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN')
  async deleteAdmin(@Param('id') id: string, @CurrentUser() user: any) {
    let tenantId = user?.tenantId || user?.tenant;
    return this.usersService.deleteAdmin(id, tenantId, user.sub, user.roles || []);
  }

  @Get('me/dashboard')
  @Roles('OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  getDashboard(@CurrentUser() user: any) {
    return this.usersService.getDashboard(user.sub);
  }

  @Get('me/subscription')
  @Roles('CUSTOMER', 'OWNER')
  getSubscription(@CurrentUser() user: any) {
    return this.usersService.getSubscription(user.sub);
  }

  @Post('me/subscription/join')
  @Roles('CUSTOMER')
  async joinSubscription(@CurrentUser() user: any, @Body() body: { plan?: 'OURO' | 'PRATA' }) {
    const plan = body?.plan === 'PRATA' ? 'PRATA' : 'OURO';
    // Read prices dynamically from DB (admin can change them)
    const prices = await this.usersService.getVipPrices(user.tenantId);
    const amount = plan === 'PRATA' ? prices.prata : prices.ouro;
    const description = `Assinatura VIP ${plan} - 1 Mês`;
    const externalRef = `sub_${plan.toLowerCase()}_${user.sub}_${Date.now()}`;

    // Salvar plano como PENDENTE na base
    await this.usersService.setPendingSubscription(user.sub, plan === 'PRATA' ? 'VIP_PRATA' : 'VIP_OURO');

    const pix = await this.paymentsService.generatePix(
      amount,
      description,
      user.email,
      externalRef
    );

    // Mock/test mode: paymentId 999999999 means no real MP webhook will arrive.
    // Activate the subscription immediately so the user doesn't get stuck on BRONZE.
    const MOCK_PAYMENT_ID = 999999999;
    if (Number(pix.paymentId) === MOCK_PAYMENT_ID) {
      await this.usersService.manualUpdateSubscription(
        user.sub,
        plan === 'PRATA' ? 'VIP_PRATA' : 'VIP_OURO'
      );
    }

    return {
      paymentId: pix.paymentId,
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      copiaCola: pix.qrCode,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
  }

  @Put('me/password')
  @Roles('OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  async updatePassword(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updatePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @Put('profile')
  @Roles('OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  updateProfile(@CurrentUser() user: any, @Body() updateData: any) {
    return this.usersService.updateProfile(user.sub, updateData);
  }

  @Post('favorite-barber/:barberId')
  @Roles('OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  favoriteBarber(@CurrentUser() user: any, @Param('barberId') barberId: string) {
    return this.usersService.updateProfile(user.sub, { favoriteBarberId: barberId });
  }

  @Get(':id/gallery')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER')
  getCustomerGallery(@Param('id') id: string, @CurrentUser() user: any) {
    const targetId = id === 'me' ? user.sub : id;
    return this.usersService.getCustomerGallery(targetId);
  }

  @Post(':id/gallery')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OWNER', 'BARBER', 'EMPLOYEE')
  async addPhotoToGallery(@Param('id') id: string, @Body() body: { imageId: string }, @CurrentUser() user: any) {
    let tenantId = user?.tenantId || user?.tenant;
    if (!tenantId) {
      const tenant = await this.usersService['userRepository']['prisma'].tenant.findFirst();
      tenantId = tenant?.id;
    }
    return this.usersService.addPhotoToGallery(id, tenantId, body.imageId);
  }

  @Delete(':id/gallery/:photoId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OWNER', 'BARBER', 'EMPLOYEE')
  async removePhotoFromGallery(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.usersService.removePhotoFromGallery(photoId);
  }

  @Patch('me/gallery/:photoId/favorite')
  @Roles('CUSTOMER')
  toggleFavoritePhoto(@Param('photoId') photoId: string, @CurrentUser() user: any) {
    return this.usersService.toggleFavoritePhoto(user.sub, photoId);
  }

  @Patch(':id')
  @Roles('OWNER', 'SUPER_ADMIN', 'ADMIN')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto, @Req() req: any) {
    try {
      console.log('--- update CALLED ---', id, updateDto, req.user);
      let tenantId = req.user?.tenantId || req.user?.tenant;
      if (!tenantId) {
        // Fetch default tenant if undefined
        const tenant = await this.usersService['userRepository']['prisma'].tenant.findFirst();
        tenantId = tenant?.id;
      }
      return await this.usersService.update(id, tenantId, updateDto);
    } catch (e) {
      console.error('--- ERROR IN update ---', e);
      throw e;
    }
  }
}
