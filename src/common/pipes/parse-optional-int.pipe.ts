import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Pipe para converter string em número inteiro opcional
 * Permite valores undefined/null e valida apenas se fornecido
 */
@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<string | undefined, number | undefined> {
  constructor(
    private readonly min?: number,
    private readonly max?: number,
    private readonly fieldName?: string,
  ) {}

  transform(value: string | undefined, metadata: ArgumentMetadata): number | undefined {
    // Se valor não fornecido, retorna undefined (campo opcional)
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const fieldName = this.fieldName || metadata.data || 'valor';
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      throw new BadRequestException(`${fieldName} deve ser um número válido`);
    }

    if (!Number.isInteger(parsedValue)) {
      throw new BadRequestException(`${fieldName} deve ser um número inteiro`);
    }

    // Validar range se especificado
    if (this.min !== undefined && parsedValue < this.min) {
      throw new BadRequestException(`${fieldName} deve ser maior ou igual a ${this.min}`);
    }

    if (this.max !== undefined && parsedValue > this.max) {
      throw new BadRequestException(`${fieldName} deve ser menor ou igual a ${this.max}`);
    }

    return parsedValue;
  }
}
