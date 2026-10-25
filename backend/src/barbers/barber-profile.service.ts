import { Injectable, NotFoundException } from '@nestjs/common';
import { BarberProfileRepository } from './repositories/barber-profile.repository';

@Injectable()
export class BarberProfileService {
  constructor(private readonly profileRepository: BarberProfileRepository) {}

  async getProfile(barberId: string) {
    const profile = await this.profileRepository.getProfile(barberId);
    if (!profile) throw new NotFoundException('Barber profile not found');
    return profile;
  }

  async addPortfolio(barberId: string, mediaId: string, description?: string) {
    return this.profileRepository.addPortfolio({
      barberId,
      mediaId,
      description,
    });
  }

  async addReview(barberId: string, userId: string, rating: number, comment?: string) {
    return this.profileRepository.addReview({
      barberId,
      userId,
      rating,
      comment,
    });
  }

  async followBarber(barberId: string, userId: string) {
    return this.profileRepository.followBarber({
      barberId,
      userId,
    });
  }

  async unfollowBarber(barberId: string, userId: string) {
    return this.profileRepository.unfollowBarber(barberId, userId);
  }

  async addSpecialty(barberId: string, specialty: string) {
    return this.profileRepository.addSpecialty({
      barberId,
      specialty,
    });
  }
}
