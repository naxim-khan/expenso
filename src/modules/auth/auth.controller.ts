import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AuthRateLimit } from './decorators/auth-rate-limit.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ limit: 10, ttlMs: 60 * 60 * 1000, keyByBodyField: 'email' })
  @ResponseMessage('User registered successfully')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ limit: 5, ttlMs: 15 * 60 * 1000, keyByBodyField: 'email' })
  @ResponseMessage('User logged in successfully')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ limit: 30, ttlMs: 60 * 1000 })
  @ResponseMessage('Token refreshed successfully')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User logged out successfully')
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Current user retrieved successfully')
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user.userId);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Admin access granted')
  adminOnly() {
    return { allowed: true };
  }
}
