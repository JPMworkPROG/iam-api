import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe para remover espaços em branco no início e fim de strings
 * Aplica trim recursivamente em objetos e arrays
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === null || value === undefined) {
      return value;
    }

    return this.trimRecursive(value);
  }

  /**
   * Aplica trim recursivamente em strings, objetos e arrays
   */
  private trimRecursive(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value.map(item => this.trimRecursive(item));
    }

    if (typeof value === 'object' && value !== null) {
      const trimmedObject: any = {};
      
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          trimmedObject[key] = this.trimRecursive(value[key]);
        }
      }
      
      return trimmedObject;
    }

    return value;
  }
}
