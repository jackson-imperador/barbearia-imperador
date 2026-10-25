import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUserRepository } from '../../users/repositories/user.repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject('USER_REPOSITORY') private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          if (request && request.cookies && request.cookies['accessToken']) {
            return request.cookies['accessToken'];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'fallback_secret_for_dev'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User is not active or does not exist');
    }

    // Map the nested userRoles into a flat string array for the RolesGuard
    user.roles = user.userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || (payload as any).roles || [];
    
    (user as any).sub = user.id;

    return user; 
  }
}
