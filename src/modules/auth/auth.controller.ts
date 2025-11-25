import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { Public } from '@shared/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { RequestPasswordResetRequestDto } from './dto/in/requestPasswordResetRequest.dto';
import { ResetPasswordRequestDto } from './dto/in/resetPasswordRequest.dto';
import { LoginResponseDto } from './dto/out/loginResponse.dto';
import { RegisterResponseDto } from './dto/out/registerResponse.dto';
import { RefreshResponseDto } from './dto/out/refreshResponse.dto';
import { RequestPasswordResetResponseDto } from './dto/out/requestPasswordResetResponse.dto';
import { ResetPasswordResponseDto } from './dto/out/resetPasswordResponse.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`Register attempt for email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    this.logger.log(`User registered successfully: ${result.user.id}`);
    return result;
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(
    @Body() loginDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`Login successful for user: ${result.user.id}`);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  async refresh(
    @Body() refreshDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    this.logger.log(`Token refresh requested`);
    const result = await this.authService.refresh(refreshDto);
    this.logger.log(`Token refreshed successfully`);
    return result;
  }

  @Post('requestPasswordReset')
  @HttpCode(HttpStatus.OK)
  @Public()
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    this.logger.log(`Password reset requested for email: ${requestDto.email}`);
    const result = await this.authService.requestPasswordReset(requestDto);
    this.logger.log(`Password reset token generated`);
    return result;
  }

  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  @Public()
  async resetPassword(
    @Body() resetDto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(`Password reset attempt with token`);
    const result = await this.authService.resetPassword(resetDto);
    this.logger.log(`Password reset completed successfully`);
    return result;
  }
}
