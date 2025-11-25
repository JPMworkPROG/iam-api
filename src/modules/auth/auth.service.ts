import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { RequestPasswordResetRequestDto } from './dto/in/requestPasswordResetRequest.dto';
import { ResetPasswordRequestDto } from './dto/in/resetPasswordRequest.dto';
import { LoginResponseDto } from './dto/out/loginResponse.dto';
import { RefreshResponseDto } from './dto/out/refreshResponse.dto';
import { RegisterResponseDto } from './dto/out/registerResponse.dto';
import { RequestPasswordResetResponseDto } from './dto/out/requestPasswordResetResponse.dto';
import { ResetPasswordResponseDto } from './dto/out/resetPasswordResponse.dto';
import { UserProfileResponseDto } from './dto/out/userProfileResponse.dto';
import { AuthRepository } from './repositories/auth.repository';
import { PasswordHasher } from '@shared/services/password-hasher.service';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordResetMessage = 'Se o email estiver cadastrado, enviaremos instruções para resetar a senha';

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) { }

  async register(registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    this.logger.debug(`Checking if email exists: ${registerDto.email}`);
    const existingUser = await this.authRepository.findByEmail(registerDto.email);

    if (existingUser) {
      this.logger.warn(`Registration failed: Email already in use - ${registerDto.email}`);
      throw new ConflictException('Email já está em uso');
    }

    this.logger.debug(`Hashing password for user: ${registerDto.email}`);
    const hashedPassword = await this.passwordHasher.hash(registerDto.password);

    this.logger.debug(`Creating user in database: ${registerDto.email}`);
    const user = await this.authRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: 'USER',
    });

    this.logger.debug(`Generating JWT tokens for user: ${user.id}`);
    const profile = new UserProfileResponseDto(user);
    const tokens = await this.jwtTokenService.generateTokens({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    });

    this.logger.log(`User registered successfully: ${user.id} (${user.email})`);
    return new RegisterResponseDto(
      profile,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
  }

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.debug(`Looking up user by email: ${loginDto.email}`);
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.debug(`Validating password for user: ${user.id}`);
    const passwordMatches = await this.passwordHasher.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      this.logger.warn(`Login failed: Invalid password for user - ${user.id}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.debug(`Generating JWT tokens for user: ${user.id}`);
    const profile = new UserProfileResponseDto(user);
    const tokens = await this.jwtTokenService.generateTokens({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    });

    this.logger.log(`Login successful: ${user.id} (${user.email})`);
    return new LoginResponseDto(
      profile,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
  }

  async refresh(refreshDto: RefreshRequestDto): Promise<RefreshResponseDto> {
    this.logger.debug(`Verifying refresh token`);
    const payload = this.jwtTokenService.verifyRefreshToken(refreshDto.refreshToken);

    this.logger.debug(`Looking up user by ID: ${payload.sub}`);
    const user = await this.authRepository.findById(payload.sub);

    if (!user) {
      this.logger.warn(`Token refresh failed: User not found - ${payload.sub}`);
      throw new UnauthorizedException('Usuário não encontrado');
    }

    this.logger.debug(`Generating new tokens for user: ${user.id}`);
    const tokens = await this.jwtTokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Token refreshed successfully for user: ${user.id}`);
    return new RefreshResponseDto(
      tokens.accessToken,
      tokens.expiresIn,
    );
  }

  async requestPasswordReset(
    requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    this.logger.debug(`Looking up user for password reset: ${requestDto.email}`);
    const user = await this.authRepository.findByEmail(requestDto.email);

    this.logger.debug(`Generating password reset token`);
    const { token, expiresAt, expiresInSeconds } = this.passwordResetTokenService.generateToken();

    if (user) {
      this.logger.debug(`Saving password reset token for user: ${user.id}`);
      await this.authRepository.createPasswordResetToken(user.id, token, expiresAt);
      this.logger.log(`Password reset token created for user: ${user.id}`);
    } else {
      this.logger.debug(`User not found for password reset: ${requestDto.email} (continuing for security)`);
    }

    return new RequestPasswordResetResponseDto(
      this.passwordResetMessage,
      randomUUID(),
      expiresInSeconds,
    );
  }

  async resetPassword(resetDto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    this.logger.debug(`Looking up password reset token`);
    const tokenData = await this.authRepository.findByPasswordResetToken(resetDto.token);

    if (!tokenData) {
      this.logger.warn(`Password reset failed: Invalid token`);
      throw new NotFoundException('Token de reset inválido');
    }

    if (tokenData.resetToken.expiresAt < new Date()) {
      this.logger.warn(`Password reset failed: Token expired for user: ${tokenData.user.id}`);
      throw new BadRequestException('Token de reset expirado');
    }

    this.logger.debug(`Hashing new password for user: ${tokenData.user.id}`);
    const hashedPassword = await this.passwordHasher.hash(resetDto.newPassword);

    this.logger.debug(`Updating password for user: ${tokenData.user.id}`);
    await this.authRepository.updatePassword(tokenData.user.id, hashedPassword);

    this.logger.log(`Password reset completed successfully for user: ${tokenData.user.id}`);
    return new ResetPasswordResponseDto('Senha atualizada com sucesso');
  }
}
