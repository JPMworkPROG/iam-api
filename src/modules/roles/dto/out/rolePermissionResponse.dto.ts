import { Role } from '@prisma/client';
import { PermissionDefinition, RolePermissionDefinition } from '../../constants/role-permissions.constant';

export class PermissionResponseDto {
  code: string;
  description: string;

  constructor(permission: PermissionDefinition) {
    this.code = permission.code;
    this.description = permission.description;
  }
}

export class RolePermissionResponseDto {
  role: Role;
  displayName: string;
  description: string;
  permissions: PermissionResponseDto[];

  constructor(definition: RolePermissionDefinition) {
    this.role = definition.role;
    this.displayName = definition.displayName;
    this.description = definition.description;
    this.permissions = definition.permissions.map((permission) => new PermissionResponseDto(permission));
  }
}
