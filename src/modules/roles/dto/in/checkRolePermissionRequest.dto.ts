import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CheckRolePermissionRequestDto {
  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  permission: string;
}
