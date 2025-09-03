import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UserResponse } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Buscar perfil do usuário logado
   */
  async findMe(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return new UserEntity(user);
  }

  /**
   * Listar todos os usuários (apenas ADMINs)
   */
  async findAll(page?: number, limit?: number): Promise<UserEntity[]> {
    // Configuração padrão para paginação
    const defaultLimit = 10;
    const defaultPage = 1;
    
    const finalLimit = limit || defaultLimit;
    const finalPage = page || defaultPage;
    const skip = (finalPage - 1) * finalLimit;

    const users = await this.prisma.user.findMany({
      skip,
      take: finalLimit,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => new UserEntity(user));
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: string, currentUser: UserResponse): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Usuários comuns só podem ver seu próprio perfil
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Acesso negado');
    }

    return new UserEntity(user);
  }

  /**
   * Criar novo usuário (apenas ADMINs)
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { email, password, name, role } = createUserDto;

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
        role: role || Role.USER,
      },
    });

    return new UserEntity(user);
  }

  /**
   * Atualizar usuário
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: UserResponse,
  ): Promise<UserEntity> {
    // Verificar se o usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar permissões
    const isOwner = currentUser.id === id;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Acesso negado');
    }

    // Usuários comuns não podem alterar o próprio papel
    if (isOwner && !isAdmin && updateUserDto.role) {
      throw new ForbiddenException('Usuários não podem alterar o próprio papel');
    }

    // Verificar se o email está sendo alterado e se já existe
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: updateUserDto.name,
      email: updateUserDto.email,
    };

    // Apenas admins podem alterar papéis
    if (isAdmin && updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    // Hash da nova senha se fornecida
    if (updateUserDto.password) {
      const saltRounds = this.configService.get<number>('auth.saltRounds', 10);
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new UserEntity(updatedUser);
  }

  /**
   * Remover usuário (apenas ADMINs)
   */
  async remove(id: string, currentUser: UserResponse): Promise<void> {
    // Verificar se o usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permitir que admin delete a si mesmo
    if (currentUser.id === id) {
      throw new ForbiddenException('Não é possível deletar sua própria conta');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
