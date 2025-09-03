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

export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Endereço de email único',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha forte contendo pelo menos 1 minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    example: 'MinhaSenh@123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 lowercase, 1 uppercase, 1 number and 1 special character',
  })
  password: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: Role,
    default: Role.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.USER;
}
