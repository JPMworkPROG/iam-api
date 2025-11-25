import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';
import { CreateRequestDto } from './dto/in/createRequest.dto';
import { UpdateRequestDto } from './dto/in/updateRequest.dto';
import { FindManyRequestDto } from './dto/in/findManyRequest.dto';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from '../auth/dto/out/userProfileResponse.dto';
import { PasswordHasher } from '@shared/services/password-hasher.service';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

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

  const mockUserResponse = new UserProfileResponseDto({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  });

  const mockAdminResponse = new UserProfileResponseDto({
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: Role.ADMIN,
    createdAt: mockAdmin.createdAt,
    updatedAt: mockAdmin.updatedAt,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PasswordHasher,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UserRepository);
    passwordHasher = module.get(PasswordHasher);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMe', () => {
    it('should return user profile', async () => {
      // Arrange
      const findMeDto: AuthenticatedUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findMe(findMeDto);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const findMeDto: AuthenticatedUser = {
        id: 'non-existent-id',
        name: 'Test User',
        email: 'test@example.com',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findMe(findMeDto)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('findMany', () => {
    it('should return array of users', async () => {
      // Arrange
      const findManyDto: FindManyRequestDto = {
        page: 1,
        limit: 10,
      };
      userRepository.findMany.mockResolvedValue([mockUser, mockAdmin]);
      userRepository.count.mockResolvedValue(2);

      // Act
      const result = await service.findMany(findManyDto);

      // Assert
      expect(userRepository.findMany).toHaveBeenCalledWith(
        1,
        10,
        {
          name: undefined,
          email: undefined,
          role: undefined,
        },
      );
      expect(result.payload).toHaveLength(2);
      expect(result.payload[0]).toHaveProperty('id');
      expect(result.payload[0]).toHaveProperty('email');
      expect(result.payload[1]).toHaveProperty('id');
      expect(result.payload[1]).toHaveProperty('email');
    });

    it('should return users with custom pagination', async () => {
      // Arrange
      const findManyDto: FindManyRequestDto = {
        page: 2,
        limit: 5,
      };
      userRepository.findMany.mockResolvedValue([mockUser]);
      userRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.findMany(findManyDto);

      // Assert
      expect(userRepository.findMany).toHaveBeenCalledWith(
        2,
        5,
        {
          name: undefined,
          email: undefined,
          role: undefined,
        },
      );
      expect(result.payload).toHaveLength(1);
    });

    it('should apply filters when provided', async () => {
      // Arrange
      const findManyDto: FindManyRequestDto = {
        page: 1,
        limit: 10,
        name: 'Test',
        email: 'test@example.com',
        role: Role.USER,
      };
      userRepository.findMany.mockResolvedValue([mockUser]);
      userRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.findMany(findManyDto);

      // Assert
      expect(userRepository.findMany).toHaveBeenCalledWith(
        1,
        10,
        {
          name: ['Test'],
          email: ['test@example.com'],
          role: [Role.USER],
        },
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne('test-user-id');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne('non-existent-id'),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });
  });

  describe('create', () => {
    const createUserDto: CreateRequestDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'Password@123',
      role: Role.USER,
    };

    it('should create user successfully', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashedPassword123');
      userRepository.create.mockResolvedValue({
        id: 'new-user-id',
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashedPassword123',
        role: createUserDto.role ?? Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(passwordHasher.hash).toHaveBeenCalledWith(createUserDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashedPassword123',
        role: createUserDto.role,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateRequestDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      // Act
      const result = await service.update('test-user-id', updateUserDto);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(updateUserDto.email);
      expect(userRepository.update).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          name: updateUserDto.name,
          email: updateUserDto.email,
        }),
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });

    it('should update user with role when provided', async () => {
      // Arrange
      const updateWithRole = { ...updateUserDto, role: Role.ADMIN };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue({
        ...mockUser,
        ...updateWithRole,
      });

      // Act
      const result = await service.update('test-user-id', updateWithRole);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(updateWithRole.email);
      expect(userRepository.update).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          name: updateWithRole.name,
          email: updateWithRole.email,
          role: updateWithRole.role,
        }),
      );
    });

    it('should hash password when provided', async () => {
      const updateWithPassword: UpdateRequestDto = {
        password: 'NewPass@123',
      };
      userRepository.findById.mockResolvedValue(mockUser);
      passwordHasher.hash.mockResolvedValue('hashedNewPassword');
      userRepository.update.mockResolvedValue({
        ...mockUser,
        password: 'hashedNewPassword',
      });

      await service.update('test-user-id', updateWithPassword);

      expect(passwordHasher.hash).toHaveBeenCalledWith(updateWithPassword.password);
      expect(userRepository.update).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ password: 'hashedNewPassword' }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('non-existent-id', updateUserDto),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });

    it('should throw ConflictException when email is already in use by same user', async () => {
      // Arrange
      const emailToUpdate = updateUserDto.email!;
      userRepository.findById.mockResolvedValue({
        ...mockUser,
        email: emailToUpdate,
      });

      // Act & Assert
      await expect(
        service.update('test-user-id', updateUserDto),
      ).rejects.toThrow(new ConflictException('Email já está em uso'));
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already in use by another user', async () => {
      // Arrange
      const emailToUpdate = updateUserDto.email!;
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue({
        ...mockAdmin,
        email: emailToUpdate,
      });

      // Act & Assert
      await expect(
        service.update('test-user-id', updateUserDto),
      ).rejects.toThrow(new ConflictException('Email já está em uso'));
      expect(userRepository.findByEmail).toHaveBeenCalledWith(emailToUpdate);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue(mockUser);

      // Act
      await service.remove('test-user-id');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(userRepository.delete).toHaveBeenCalledWith('test-user-id');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.remove('non-existent-id'),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });
  });
});
