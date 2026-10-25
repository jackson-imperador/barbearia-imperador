import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSiteSettingsDto {
  @IsOptional() @IsString() logoId?: string;
  @IsOptional() @IsString() appIconId?: string;
  @IsOptional() @IsString() heroBannerId?: string;
  @IsOptional() @IsString() homeVideoId?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() aboutUs?: string;
  @IsOptional() @IsString() siteName?: string;
  @IsOptional() @IsString() homeTitle?: string;
  @IsOptional() @IsString() homeSubtitle?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() workingHours?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() facebookUrl?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsString() twitterUrl?: string;

  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() aboutImage1Id?: string;
  @IsOptional() @IsString() aboutImage2Id?: string;
  @IsOptional() @IsString() aboutImage3Id?: string;
  @IsOptional() @IsString() aboutImage4Id?: string;
  @IsOptional() @IsString() faviconId?: string;
  @IsOptional() @IsString() defaultImageId?: string;
  @IsOptional() @IsString() academyBannerId?: string;
  @IsOptional() @IsString() closedDays?: string;
  @IsOptional() @IsString() noShowPolicy?: string;
  @IsOptional() @IsString() confirmationMessage?: string;
  // VIP Club prices — editable by admin
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) vipPrataPrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) vipOuroPrice?: number;

  @IsOptional() @IsString() policyCancellation?: string;
  @IsOptional() @IsString() policyPrivacy?: string;
  @IsOptional() @IsString() termsOfUse?: string;
  @IsOptional() @IsString() storePolicy?: string;

  @IsOptional() @IsString() academyName?: string;
  @IsOptional() @IsString() academyDescription?: string;

  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() storeMessage?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) cancellationLimitHours?: number;
}

export class CreateBannerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsString() imageId: string;
  @IsOptional() @IsString() videoId?: string;
  @IsOptional() @IsString() linkUrl?: string;
  @IsOptional() @IsNumber() @Type(() => Number) displayOrder?: number;
  @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class UpdateBannerDto extends CreateBannerDto {}

export class CreateGalleryDto {
  @IsString() imageId: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsNumber() @Type(() => Number) displayOrder?: number;
  @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class UpdateGalleryDto extends CreateGalleryDto {}

export class CreateTestimonialDto {
  @IsString() authorName: string;
  @IsOptional() @IsString() authorPhotoId?: string;
  @IsString() content: string;
  @IsOptional() @IsNumber() @Type(() => Number) rating?: number;
  @IsOptional() @IsNumber() @Type(() => Number) displayOrder?: number;
  @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class UpdateTestimonialDto extends CreateTestimonialDto {}
