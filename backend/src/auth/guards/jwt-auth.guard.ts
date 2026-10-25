import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const activated = await super.canActivate(context);
      return activated as boolean;
    } catch (err: any) {
      if (isPublic) {
        return true; // Allow access but req.user will be undefined
      }
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(err?.message || 'Authentication token missing or invalid');
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public routes, allow even if no user (unauthenticated)
    if (isPublic && !user && !err) {
      return null;
    }

    if (err || !user) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const message = info?.message || err?.message || 'Authentication token missing or invalid';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
