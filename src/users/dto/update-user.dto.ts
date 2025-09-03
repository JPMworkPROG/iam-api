import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Novo endereço de email',
    example: 'joao.santos@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Nova senha (opcional)',
    example: 'NovaSenh@456',
    minLength: 8,
    maxLength: 128,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 lowercase, 1 uppercase, 1 number and 1 special character',
  })
  password?: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema (apenas admins podem alterar)',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
