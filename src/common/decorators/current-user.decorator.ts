import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserResponse } from '../../auth/auth.service';

/**
 * Decorator para obter o usuário atual da requisição autenticada
 * Extrai os dados do usuário do request após validação JWT
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserResponse | undefined, ctx: ExecutionContext): UserResponse => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
