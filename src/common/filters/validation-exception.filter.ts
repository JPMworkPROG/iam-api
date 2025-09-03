import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from './http-exception.filter';

/**
 * Filtro específico para exceções de validação
 * Formata erros de class-validator de forma mais amigável
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    // Verificar se é erro de validação do class-validator
    const isValidationError = this.isValidationError(exceptionResponse);
    
    let message: string | string[];
    
    if (isValidationError) {
      message = this.formatValidationErrors(exceptionResponse);
    } else {
      message = this.extractMessage(exceptionResponse);
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Log apenas se não for erro de validação comum
    if (!isValidationError) {
      this.logger.warn(
        `Bad Request: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Verifica se a exceção é um erro de validação do class-validator
   */
  private isValidationError(exceptionResponse: any): boolean {
    return (
      typeof exceptionResponse === 'object' &&
      exceptionResponse?.message &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0 &&
      typeof exceptionResponse.message[0] === 'string'
    );
  }

  /**
   * Formata erros de validação para serem mais amigáveis
   */
  private formatValidationErrors(exceptionResponse: any): string[] {
    if (!this.isValidationError(exceptionResponse)) {
      return [this.extractMessage(exceptionResponse) as string];
    }

    return exceptionResponse;
  }

  private extractMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse?.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(', ');
      }
      return exceptionResponse.message;
    }

    return 'Dados inválidos';
  }
}
