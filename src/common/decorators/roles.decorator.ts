import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir os papéis necessários para acessar uma rota
 * Usado em conjunto com RolesGuard para autorização baseada em papéis
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
