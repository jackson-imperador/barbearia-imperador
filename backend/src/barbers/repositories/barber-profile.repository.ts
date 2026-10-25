import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Barber, BarberPortfolio, BarberReview, BarberFollower, BarberSpecialty } from '@prisma/client';

@Injectable()
export class BarberProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(barberId: string): Promise<Barber | null> {
    return this.prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        portfolio: true,
        reviews: true,
        followers: true,
        specialties: true,
      },
    });
  }

  async addPortfolio(data: { barberId: string; mediaId: string; description?: string }): Promise<BarberPortfolio> {
    return this.prisma.barberPortfolio.create({ data });
  }

  async addReview(data: { barberId: string; userId: string; rating: number; comment?: string }): Promise<BarberReview> {
    return this.prisma.barberReview.create({ data });
  }

  async followBarber(data: { barberId: string; userId: string }): Promise<BarberFollower> {
    return this.prisma.barberFollower.create({ data });
  }

  async unfollowBarber(barberId: string, userId: string): Promise<void> {
    await this.prisma.barberFollower.deleteMany({
      where: { barberId, userId },
    });
  }

  async addSpecialty(data: { barberId: string; specialty: string }): Promise<BarberSpecialty> {
    return this.prisma.barberSpecialty.create({ data });
  }
}
