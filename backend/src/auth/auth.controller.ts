import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UseGuards, Ip, Headers } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Patch } from '@nestjs/common';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const tokens = await this.authService.login(loginDto, ip, userAgent);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      message: 'Logged in successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const tokens = await this.authService.register(registerDto);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      message: 'Registered successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = (req.cookies as any)['refreshToken'];
    await this.authService.logout(user.id, refreshToken);
    this.clearCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, changePasswordDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: FastifyRequest,
    @Body() body: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = (body && body.refreshToken) || (req.cookies as any)?.['refreshToken'];
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).send({ message: 'Refresh token required' });
      return;
    }
    
    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      message: 'Tokens refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private setCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
    const forceSecure = this.configService.get('COOKIE_SECURE') === 'true';
    
    res.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: forceSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: forceSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  private clearCookies(res: FastifyReply) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
