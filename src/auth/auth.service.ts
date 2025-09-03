import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra um novo usuário no sistema
   */
  async register(registerDto: RegisterDto): Promise<UserResponse> {
    const { email, password, name, role } = registerDto;

    // Verificar se o email já está em uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const saltRounds = this.configService.get<number>('auth.saltRounds', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER',
      },
    });

    // Retornar dados do usuário sem a senha
    return this.formatUserResponse(user);
  }

  /**
   * Autentica um usuário e retorna tokens JWT
   */
  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const { email, password } = loginDto;

    // Buscar usuário por email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar tokens
    return this.generateTokens(user);
  }

  /**
   * Renova tokens JWT usando refresh token válido
   */
  async refresh(refreshDto: RefreshDto): Promise<AuthTokens> {
    try {
      // Verificar e decodificar o refresh token
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Buscar usuário pelo ID do payload
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gerar novos tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  /**
   * Valida um usuário (usado pela estratégia JWT)
   */
  async validateUser(userId: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.formatUserResponse(user);
  }

  /**
   * Gera tokens de acesso e refresh
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { 
        expiresIn: this.configService.get<string>('jwt.accessExpires', '15m') 
      }),
      this.jwtService.signAsync(payload, { 
        expiresIn: this.configService.get<string>('jwt.refreshExpires', '7d'),
        secret: this.configService.get<string>('jwt.refreshSecret')
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Formata a resposta do usuário removendo dados sensíveis
   */
  private formatUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
