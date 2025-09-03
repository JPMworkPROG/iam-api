import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserResponse } from '../auth/auth.service';
import { TrimPipe, ParsePositiveIntPipe, ParseOptionalIntPipe } from '../common/pipes';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Obter perfil do usuário logado',
    description: 'Retorna os dados do usuário atualmente autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: UserEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async findMe(@CurrentUser() user: UserResponse): Promise<UserEntity> {
    return this.usersService.findMe(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description: 'Retorna uma lista com todos os usuários cadastrados com paginação (apenas para ADMINs)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número da página (começando em 1)',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Quantidade de itens por página (máximo 100)',
    required: false,
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    type: [UserEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  async findAll(
    @Query('page', new ParseOptionalIntPipe(1, 1000, 'página')) page?: number,
    @Query('limit', new ParseOptionalIntPipe(1, 100, 'limite')) limit?: number,
  ): Promise<UserEntity[]> {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter usuário por ID',
    description: 'Retorna os dados de um usuário específico. Usuários comuns só podem ver seu próprio perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado com sucesso',
    type: UserEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - não é possível ver perfil de outro usuário',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserResponse,
  ): Promise<UserEntity> {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Criar novo usuário',
    description: 'Cria um novo usuário no sistema (apenas para ADMINs)',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  async create(@Body(TrimPipe) createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário. Usuários podem editar seu próprio perfil, ADMINs podem editar qualquer usuário.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: UserEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  async update(
    @Param('id') id: string,
    @Body(TrimPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserResponse,
  ): Promise<UserEntity> {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Remove um usuário do sistema (apenas para ADMINs)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuário removido com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores ou não é possível deletar própria conta',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserResponse,
  ): Promise<void> {
    return this.usersService.remove(id, user);
  }
}
