import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { isEmail } from 'class-validator';

/**
 * Pipe para normalização e validação de emails
 * Converte para lowercase, remove espaços e valida formato
 */
@Injectable()
export class EmailNormalizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Email deve ser uma string');
    }

    // Normalizar o email
    const normalizedEmail = this.normalizeEmail(value);
    
    // Validar formato
    if (!isEmail(normalizedEmail)) {
      throw new BadRequestException('Email deve ter um formato válido');
    }

    return normalizedEmail;
  }

  /**
   * Normaliza o email aplicando transformações padrão
   */
  private normalizeEmail(email: string): string {
    return email
      .trim()           // Remove espaços em branco
      .toLowerCase()    // Converte para minúsculas
      .replace(/\s+/g, ''); // Remove qualquer espaço interno
  }
}
