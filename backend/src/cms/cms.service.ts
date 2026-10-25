import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class CmsService {
  constructor(private readonly cmsRepository: CmsRepository) {}

  async getSiteSettings(tenantId: string) {
    let settings = await this.cmsRepository.getSiteSettings(tenantId);
    if (!settings) {
      settings = await this.cmsRepository.createSiteSettings(tenantId);
    }
    return settings;
  }

  async updateSiteSettings(tenantId: string, data: UpdateSiteSettingsDto) {
    return this.cmsRepository.upsertSiteSettings(tenantId, data);
  }

  async getBanners(tenantId: string) {
    return this.cmsRepository.getBanners(tenantId);
  }

  async createBanner(tenantId: string, data: CreateBannerDto) {
    return this.cmsRepository.createBanner(tenantId, data);
  }

  async updateBanner(id: string, data: UpdateBannerDto) {
    return this.cmsRepository.updateBanner(id, data);
  }

  async deleteBanner(id: string) {
    return this.cmsRepository.deleteBanner(id);
  }

  async getGalleries(tenantId: string) {
    return this.cmsRepository.getGalleries(tenantId);
  }

  async createGallery(tenantId: string, data: CreateGalleryDto) {
    return this.cmsRepository.createGallery(tenantId, data);
  }

  async updateGallery(id: string, data: UpdateGalleryDto) {
    return this.cmsRepository.updateGallery(id, data);
  }

  async deleteGallery(id: string) {
    return this.cmsRepository.deleteGallery(id);
  }

  async getTestimonials(tenantId: string) {
    return this.cmsRepository.getTestimonials(tenantId);
  }

  async createTestimonial(tenantId: string, data: CreateTestimonialDto) {
    return this.cmsRepository.createTestimonial(tenantId, data);
  }

  async updateTestimonial(id: string, data: UpdateTestimonialDto) {
    return this.cmsRepository.updateTestimonial(id, data);
  }

  async deleteTestimonial(id: string) {
    return this.cmsRepository.deleteTestimonial(id);
  }
}