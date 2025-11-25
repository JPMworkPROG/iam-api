import { Role } from '@prisma/client';
import { RolePermissionDefinition } from '../../constants/role-permissions.constant';
import { PermissionResponseDto } from './rolePermissionResponse.dto';

export class CheckRolePermissionResponseDto {
  role: Role;
  permission: string;
  allowed: boolean;
  permissions: PermissionResponseDto[];

  constructor(definition: RolePermissionDefinition, permission: string, allowed: boolean) {
    this.role = definition.role;
    this.permission = permission;
    this.allowed = allowed;
    this.permissions = definition.permissions.map((permissionDef) => new PermissionResponseDto(permissionDef));
  }
}
