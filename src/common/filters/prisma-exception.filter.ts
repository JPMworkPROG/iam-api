import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ErrorResponse } from './http-exception.filter';

/**
 * Filtro para capturar e tratar exceções específicas do Prisma
 * Converte erros de banco de dados em respostas HTTP apropriadas
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { code, meta } = exception;
      
      switch (code) {
        case 'P2002':
          // Violação de constraint único
          status = HttpStatus.CONFLICT;
          message = this.extractUniqueConstraintMessage(meta);
          break;
        
        case 'P2025':
          // Registro não encontrado
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado';
          break;
        
        case 'P2003':
          // Violação de chave estrangeira
          status = HttpStatus.BAD_REQUEST;
          message = 'Operação inválida - referência não encontrada';
          break;
        
        case 'P2014':
          // Relação requerida violada
          status = HttpStatus.BAD_REQUEST;
          message = 'Operação inválida - dependência necessária';
          break;
        
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Erro na operação do banco de dados';
          this.logger.warn(`Prisma error code not mapped: ${code}`);
      }
      
      this.logger.error(
        `Prisma Error [${code}]: ${exception.message}`,
        exception.stack,
      );
      
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Erro de validação do Prisma
      status = HttpStatus.BAD_REQUEST;
      message = 'Dados inválidos fornecidos';
      
      this.logger.error(
        `Prisma Validation Error: ${exception.message}`,
        exception.stack,
      );
    } else {
      // Fallback para outros erros do Prisma
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno do banco de dados';
      
      this.logger.error(
        `Unknown Prisma Error: ${String(exception)}`,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Extrai mensagem amigável para violação de constraint único
   */
  private extractUniqueConstraintMessage(meta?: any): string {
    if (meta?.target) {
      const field = Array.isArray(meta.target) ? meta.target[0] : meta.target;
      
      switch (field) {
        case 'email':
          return 'Email já está em uso';
        case 'username':
          return 'Nome de usuário já está em uso';
        default:
          return `${field} já está em uso`;
      }
    }
    
    return 'Valor duplicado - registro já existe';
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Error';
    }
  }
}
