import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSiteSettings(tenantId: string) {
    return this.prisma.siteSettings.findUnique({
      where: { tenantId },
      include: { logo: true, appIcon: true, heroBanner: true, homeVideo: true, favicon: true, defaultImage: true, academyBanner: true, aboutImage1: true, aboutImage2: true, aboutImage3: true, aboutImage4: true },
    });
  }

  async createSiteSettings(tenantId: string) {
    return this.prisma.siteSettings.create({
      data: { tenantId },
      include: { logo: true, appIcon: true, heroBanner: true, homeVideo: true, favicon: true, defaultImage: true, academyBanner: true, aboutImage1: true, aboutImage2: true, aboutImage3: true, aboutImage4: true },
    });
  }

  async upsertSiteSettings(tenantId: string, data: any) {
    return this.prisma.siteSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
      include: { logo: true, appIcon: true, heroBanner: true, homeVideo: true, favicon: true, defaultImage: true, academyBanner: true, aboutImage1: true, aboutImage2: true, aboutImage3: true, aboutImage4: true },
    });
  }

  async getBanners(tenantId: string) {
    return this.prisma.banner.findMany({
      where: { tenantId, deletedAt: null },
      include: { image: true, video: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(tenantId: string, data: any) {
    return this.prisma.banner.create({
      data: { tenantId, ...data },
      include: { image: true, video: true },
    });
  }

  async updateBanner(id: string, data: any) {
    return this.prisma.banner.update({
      where: { id },
      data,
      include: { image: true, video: true },
    });
  }

  async deleteBanner(id: string) {
    return this.prisma.banner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getGalleries(tenantId: string) {
    return this.prisma.gallery.findMany({
      where: { tenantId, deletedAt: null },
      include: { image: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createGallery(tenantId: string, data: any) {
    return this.prisma.gallery.create({
      data: { tenantId, ...data },
      include: { image: true },
    });
  }

  async updateGallery(id: string, data: any) {
    return this.prisma.gallery.update({
      where: { id },
      data,
      include: { image: true },
    });
  }

  async deleteGallery(id: string) {
    return this.prisma.gallery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTestimonials(tenantId: string) {
    return this.prisma.testimonial.findMany({
      where: { tenantId, deletedAt: null },
      include: { authorPhoto: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createTestimonial(tenantId: string, data: any) {
    return this.prisma.testimonial.create({
      data: { tenantId, ...data },
      include: { authorPhoto: true },
    });
  }

  async updateTestimonial(id: string, data: any) {
    return this.prisma.testimonial.update({
      where: { id },
      data,
      include: { authorPhoto: true },
    });
  }

  async deleteTestimonial(id: string) {
    return this.prisma.testimonial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findFirstTenant() {
    return this.prisma.tenant.findFirst();
  }
}
