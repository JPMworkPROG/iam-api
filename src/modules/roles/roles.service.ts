import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ROLE_PERMISSIONS, RolePermissionDefinition } from './constants/role-permissions.constant';
import { RolePermissionResponseDto } from './dto/out/rolePermissionResponse.dto';
import { CheckRolePermissionResponseDto } from './dto/out/checkRolePermissionResponse.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private readonly rolePermissions = ROLE_PERMISSIONS;

  listPermissions(): RolePermissionResponseDto[] {
    this.logger.debug('Listing permissions for all roles');
    return this.rolePermissions.map((definition) => new RolePermissionResponseDto(definition));
  }

  getRolePermissions(role: Role): RolePermissionResponseDto {
    const definition = this.findRoleDefinition(role);
    this.logger.debug(`Fetching permissions for role: ${role}`);
    return new RolePermissionResponseDto(definition);
  }

  checkPermission(role: Role, permission: string): CheckRolePermissionResponseDto {
    const definition = this.findRoleDefinition(role);
    const allowed = definition.permissions.some((item) => item.code === permission);

    this.logger.debug(`Checking permission "${permission}" for role ${role}: ${allowed}`);
    return new CheckRolePermissionResponseDto(definition, permission, allowed);
  }

  private findRoleDefinition(role: Role): RolePermissionDefinition {
    const definition = this.rolePermissions.find((item) => item.role === role);

    if (!definition) {
      this.logger.warn(`Role not found when fetching permissions: ${role}`);
      throw new NotFoundException('Cargo não encontrado');
    }

    return definition;
  }
}
