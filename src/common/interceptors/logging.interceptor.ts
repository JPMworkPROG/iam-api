import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor para logging automático de todas as requisições
 * Registra método, URL, status, tempo de resposta e informações do usuário
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, ip } = request;
    const startTime = Date.now();
    
    // Extrair informações do usuário se autenticado
    const user = request.user as any; // User object from JWT strategy
    const userInfo = user ? `User: ${user.id} (${user.email})` : 'Unauthenticated';

    // Log da requisição entrante
    this.logger.log(`📥 ${method} ${url} - IP: ${ip} - ${userInfo}`);

    return next.handle().pipe(
      tap((data) => {
        // Log da resposta bem-sucedida
        const duration = Date.now() - startTime;
        const { statusCode } = response;
        
        // Informações sobre o payload de resposta (sem dados sensíveis)
        const responseSize = data ? JSON.stringify(data).length : 0;
        
        this.logger.log(
          `📤 ${method} ${url} - ${statusCode} - ${duration}ms - ${responseSize} bytes`,
        );
      }),
      catchError((error) => {
        // Log de erro
        const duration = Date.now() - startTime;
        
        this.logger.error(
          `❌ ${method} ${url} - ERROR: ${error.message} - ${duration}ms - ${userInfo}`,
          error.stack,
        );
        
        throw error; // Re-throw para não afetar o fluxo de erro
      }),
    );
  }
}
