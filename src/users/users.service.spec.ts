import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponse } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
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

  const mockAdmin = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'hashedPassword123',
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse: UserResponse = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: mockUser.createdAt,
  };

  const mockAdminResponse: UserResponse = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: Role.ADMIN,
    createdAt: mockAdmin.createdAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
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

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMe', () => {
    it('should return user profile', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.findMe('test-user-id');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      // A senha é excluída pela classe UserEntity (class-transformer)
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findMe('non-existent-id')).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      // Arrange
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        mockUser,
        mockAdmin,
      ]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('email');
      expect(result[1]).toHaveProperty('id');
      expect(result[1]).toHaveProperty('email');
    });

    it('should return users with custom pagination', async () => {
      // Arrange
      const page = 2;
      const limit = 5;
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      // Act
      const result = await service.findAll(page, limit);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should use default values when page and limit are undefined', async () => {
      // Arrange
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      // Act
      const result = await service.findAll(undefined, undefined);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return user when admin requests any user', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne('test-user-id', mockAdminResponse);

      // Assert
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should return user when user requests their own profile', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne('test-user-id', mockUserResponse);

      // Assert
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw ForbiddenException when user tries to access another user profile', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      // Act & Assert
      await expect(
        service.findOne('admin-user-id', mockUserResponse),
      ).rejects.toThrow(new ForbiddenException('Acesso negado'));
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne('non-existent-id', mockAdminResponse),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'Password@123',
      role: Role.USER,
    };

    it('should create user successfully', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (configService.get as jest.Mock).mockReturnValue(10); // saltRounds
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashedPassword123',
        role: createUserDto.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: 'hashedPassword123',
          role: createUserDto.role,
        },
      });
      // A senha é excluída pela classe UserEntity (class-transformer)
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user when user updates their own profile', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // existingUser check
        .mockResolvedValueOnce(null); // email check
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      // Act
      const result = await service.update('test-user-id', updateUserDto, mockUserResponse);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
        },
      });
      // A senha é excluída pela classe UserEntity (class-transformer)
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should update user when admin updates any user', async () => {
      // Arrange
      const updateWithRole = { ...updateUserDto, role: Role.ADMIN };
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateWithRole,
      });

      // Act
      const result = await service.update('test-user-id', updateWithRole, mockAdminResponse);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          name: updateWithRole.name,
          email: updateWithRole.email,
          role: updateWithRole.role,
        },
      });
    });

    it('should throw ForbiddenException when user tries to update role', async () => {
      // Arrange
      const updateWithRole = { ...updateUserDto, role: Role.ADMIN };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.update('test-user-id', updateWithRole, mockUserResponse),
      ).rejects.toThrow(
        new ForbiddenException('Usuários não podem alterar o próprio papel'),
      );
    });

    it('should throw ForbiddenException when user tries to update another user', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      // Act & Assert
      await expect(
        service.update('admin-user-id', updateUserDto, mockUserResponse),
      ).rejects.toThrow(new ForbiddenException('Acesso negado'));
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('non-existent-id', updateUserDto, mockAdminResponse),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });

    it('should throw ConflictException when email is already in use', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // existingUser check
        .mockResolvedValueOnce(mockAdmin); // email check

      // Act & Assert
      await expect(
        service.update('test-user-id', updateUserDto, mockUserResponse),
      ).rejects.toThrow(new ConflictException('Email já está em uso'));
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await service.remove('test-user-id', mockAdminResponse);

      // Assert
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
    });

    it('should throw ForbiddenException when admin tries to delete themselves', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      // Act & Assert
      await expect(
        service.remove('admin-user-id', mockAdminResponse),
      ).rejects.toThrow(
        new ForbiddenException('Não é possível deletar sua própria conta'),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.remove('non-existent-id', mockAdminResponse),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });
  });
});
