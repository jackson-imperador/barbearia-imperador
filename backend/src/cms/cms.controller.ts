import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CmsRepository } from './repositories/cms.repository';
import {
  UpdateSiteSettingsDto,
  CreateBannerDto,
  UpdateBannerDto,
  CreateGalleryDto,
  UpdateGalleryDto,
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/cms.dto';

@Controller('cms')
@UseGuards(JwtAuthGuard)
export class CmsController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly cmsRepository: CmsRepository
  ) {}

  private async getTenantId(user: any) {
    if (user?.tenantId) return user.tenantId;
    const defaultTenant = await this.cmsRepository.findFirstTenant();
    return defaultTenant?.id;
  }

  @Get('settings')
  @Public()
  async getSettings(@CurrentUser() user: any) {
    const tenantId = await this.getTenantId(user);
    return this.cmsService.getSiteSettings(tenantId);
  }

  @Put('settings')
  async updateSettings(@CurrentUser() user: any, @Body() data: UpdateSiteSettingsDto) {
    return this.cmsService.updateSiteSettings(user.tenantId, data);
  }

  @Get('banners')
  @Public()
  async getBanners(@CurrentUser() user: any) {
    const tenantId = await this.getTenantId(user);
    return this.cmsService.getBanners(tenantId);
  }

  @Post('banners')
  async createBanner(@CurrentUser() user: any, @Body() data: CreateBannerDto) {
    return this.cmsService.createBanner(user.tenantId, data);
  }

  @Put('banners/:id')
  async updateBanner(@Param('id') id: string, @Body() data: UpdateBannerDto) {
    return this.cmsService.updateBanner(id, data);
  }

  @Delete('banners/:id')
  async deleteBanner(@Param('id') id: string) {
    return this.cmsService.deleteBanner(id);
  }

  @Get('galleries')
  @Public()
  async getGalleries(@CurrentUser() user: any) {
    const tenantId = await this.getTenantId(user);
    return this.cmsService.getGalleries(tenantId);
  }

  @Post('galleries')
  async createGallery(@CurrentUser() user: any, @Body() data: CreateGalleryDto) {
    return this.cmsService.createGallery(user.tenantId, data);
  }

  @Put('galleries/:id')
  async updateGallery(@Param('id') id: string, @Body() data: UpdateGalleryDto) {
    return this.cmsService.updateGallery(id, data);
  }

  @Delete('galleries/:id')
  async deleteGallery(@Param('id') id: string) {
    return this.cmsService.deleteGallery(id);
  }

  @Get('testimonials')
  @Public()
  async getTestimonials(@CurrentUser() user: any) {
    const tenantId = await this.getTenantId(user);
    return this.cmsService.getTestimonials(tenantId);
  }

  @Post('testimonials')
  async createTestimonial(@CurrentUser() user: any, @Body() data: CreateTestimonialDto) {
    return this.cmsService.createTestimonial(user.tenantId, data);
  }

  @Put('testimonials/:id')
  async updateTestimonial(@Param('id') id: string, @Body() data: UpdateTestimonialDto) {
    return this.cmsService.updateTestimonial(id, data);
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(@Param('id') id: string) {
    return this.cmsService.deleteTestimonial(id);
  }
}