import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard para proteger rotas que requerem autenticação JWT
 * Utiliza a estratégia JWT configurada no AuthModule
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
