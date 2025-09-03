import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: mockUser.createdAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password@123',
      role: Role.USER,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (configService.get as jest.Mock).mockReturnValue(10); // saltRounds
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          name: registerDto.name,
          password: 'hashedPassword123',
          role: registerDto.role,
        },
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should use default USER role when role is not provided', async () => {
      // Arrange
      const registerDtoWithoutRole = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password@123',
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (configService.get as jest.Mock).mockReturnValue(10); // saltRounds
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await service.register(registerDtoWithoutRole);

      // Assert
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDtoWithoutRole.email,
          name: registerDtoWithoutRole.name,
          password: 'hashedPassword123',
          role: 'USER',
        },
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password@123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const refreshDto: RefreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: Role.USER,
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockPayload);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (configService.get as jest.Mock)
        .mockReturnValueOnce('refresh-secret') // jwt.refreshSecret
        .mockReturnValueOnce('15m') // jwt.accessExpires
        .mockReturnValueOnce('7d') // jwt.refreshExpires
        .mockReturnValueOnce('refresh-secret'); // jwt.refreshSecret
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      // Act
      const result = await service.refresh(refreshDto);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(refreshDto.refreshToken, {
        secret: 'refresh-secret',
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockPayload);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (configService.get as jest.Mock).mockReturnValue('refresh-secret');

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });

    it('should throw UnauthorizedException when refresh token is expired', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when user exists', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser('test-user-id');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.validateUser('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with correct payload', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce('15m') // jwt.accessExpires
        .mockReturnValueOnce('7d') // jwt.refreshExpires
        .mockReturnValueOnce('refresh-secret'); // jwt.refreshSecret
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service['generateTokens'](mockUser);

      // Assert
      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: '15m',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: '7d',
        secret: 'refresh-secret',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('formatUserResponse', () => {
    it('should format user response without sensitive data', () => {
      // Act
      const result = service['formatUserResponse'](mockUser);

      // Assert
      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('updatedAt');
    });
  });
});
