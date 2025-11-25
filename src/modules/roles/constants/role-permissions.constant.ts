import { Role } from '@prisma/client';

export type PermissionDefinition = {
  code: string;
  description: string;
};

export type RolePermissionDefinition = {
  role: Role;
  displayName: string;
  description: string;
  permissions: PermissionDefinition[];
};

export const ROLE_PERMISSIONS: RolePermissionDefinition[] = [
  {
    role: Role.ADMIN,
    displayName: 'Administrador',
    description: 'Controle total de usuários, autenticação e auditoria',
    permissions: [
      {
        code: 'users:read',
        description: 'Listar e consultar todos os usuários com filtros e paginação',
      },
      {
        code: 'users:create',
        description: 'Criar novos usuários e definir seus cargos',
      },
      {
        code: 'users:update',
        description: 'Atualizar qualquer informação de qualquer usuário',
      },
      {
        code: 'users:delete',
        description: 'Remover usuários do sistema',
      },
      {
        code: 'auth:password:reset:any',
        description: 'Solicitar e confirmar resets de senha para qualquer usuário',
      },
    ],
  },
  {
    role: Role.USER,
    displayName: 'Usuário',
    description: 'Acesso básico aos próprios dados e operações de autenticação',
    permissions: [
      {
        code: 'users:read:self',
        description: 'Consultar o próprio perfil com /users/me',
      },
      {
        code: 'users:list',
        description: 'Visualizar a lista geral de usuários (campos públicos)',
      },
      {
        code: 'auth:tokens:refresh',
        description: 'Renovar o access token a partir do refresh token',
      },
      {
        code: 'auth:password:reset:self',
        description: 'Solicitar e concluir reset da própria senha',
      },
    ],
  },
];
