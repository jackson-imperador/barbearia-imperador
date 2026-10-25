import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IUserRepository } from '../users/repositories/user.repository.interface';
import { IRefreshTokenRepository } from './repositories/refresh-token.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY') private readonly userRepository: IUserRepository,
    @Inject('REFRESH_TOKEN_REPOSITORY') private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.userRepository.findByEmail(loginDto.email);

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    return this.generateTokens(user.id, user.email, user.tenantId, roles);
  }

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const normalizedPhone = registerDto.phone ? registerDto.phone.replace(/\D/g, '') : '';
    const passwordHash = await argon2.hash(registerDto.password);

    // Add customer to the EXISTING barbershop tenant (single-tenant mode).
    // Old code called registerNewTenantAndUser() which created a separate tenant
    // per customer, making them completely invisible to the admin panel.
    const newUser = await this.userRepository.registerCustomerInExistingTenant(
      registerDto.firstName,
      registerDto.lastName,
      normalizedEmail,
      normalizedPhone,
      passwordHash
    );

    return this.generateTokens(newUser.id, newUser.email, newUser.tenantId, ['CUSTOMER']);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, changePasswordDto.currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is not valid');
    }

    const newPasswordHash = await argon2.hash(changePasswordDto.newPassword);
    
    // Using prisma directly since userRepository doesn't expose updatePassword directly
    await (this.userRepository as any).prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return { message: 'Password updated successfully' };
  }

  async logout(userId: string, refreshToken: string) {
    if (!refreshToken) return;
    
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return;

    const userTokens = await this.refreshTokenRepository.findManyByUserId(userId);

    for (const record of userTokens) {
      if (await argon2.verify(record.token, refreshToken)) {
        await this.refreshTokenRepository.updateRevoked(record.id, true);
        break;
      }
    }
  }

  async refreshTokens(rawToken: string) {
    const parts = rawToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const userId = parts[0];

    const userTokens = await this.refreshTokenRepository.findValidManyByUserId(userId);

    let validTokenRecord: any = null;
    for (const record of userTokens) {
      if (await argon2.verify(record.token, rawToken)) {
        validTokenRecord = record;
        break;
      }
    }

    if (!validTokenRecord || !validTokenRecord.user || !validTokenRecord.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token Rotation: revoke old token
    await this.refreshTokenRepository.updateRevoked(validTokenRecord.id, true);

    const roles = validTokenRecord.user.userRoles?.map((ur: any) => ur.role.name) || [];
    return this.generateTokens(validTokenRecord.user.id, validTokenRecord.user.email, validTokenRecord.user.tenantId, roles);
  }

  private async generateTokens(userId: string, email: string, tenantId: string, roles: string[] = []) {
    const payload = { sub: userId, email, tenantId, roles };
    const accessToken = this.jwtService.sign(payload);
    
    const randomHex = randomBytes(32).toString('hex');
    const rawRefreshToken = `${userId}.${randomHex}`;
    
    const hashedRefreshToken = await argon2.hash(rawRefreshToken);
    
    const expiresInDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.refreshTokenRepository.create({
      userId,
      token: hashedRefreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
