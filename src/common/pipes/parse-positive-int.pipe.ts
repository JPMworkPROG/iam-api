import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Pipe para converter string em número inteiro positivo
 * Valida se o valor é um número inteiro maior que 0
 */
@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  constructor(private readonly fieldName?: string) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const fieldName = this.fieldName || metadata.data || 'valor';

    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName} é obrigatório`);
    }

    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      throw new BadRequestException(`${fieldName} deve ser um número válido`);
    }

    if (parsedValue <= 0) {
      throw new BadRequestException(`${fieldName} deve ser um número positivo maior que zero`);
    }

    if (!Number.isInteger(parsedValue)) {
      throw new BadRequestException(`${fieldName} deve ser um número inteiro`);
    }

    return parsedValue;
  }
}
