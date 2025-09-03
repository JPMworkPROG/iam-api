import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Interface para configuração de validação de senha
 */
interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  specialChars?: string;
}

/**
 * Pipe para validação avançada de senhas
 * Verifica critérios de segurança conforme configuração
 */
@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  private readonly defaultOptions: PasswordValidationOptions = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  constructor(private readonly options: PasswordValidationOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  transform(value: any, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Senha deve ser uma string');
    }

    const password = value.trim();
    
    if (!password) {
      throw new BadRequestException('Senha é obrigatória');
    }

    this.validatePassword(password);
    
    return password;
  }

  /**
   * Valida a senha conforme os critérios configurados
   */
  private validatePassword(password: string): void {
    const errors: string[] = [];

    // Verificar comprimento mínimo
    if (this.options.minLength && password.length < this.options.minLength) {
      errors.push(`Senha deve ter pelo menos ${this.options.minLength} caracteres`);
    }

    // Verificar letra maiúscula
    if (this.options.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    // Verificar letra minúscula
    if (this.options.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    // Verificar números
    if (this.options.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    // Verificar caracteres especiais
    if (this.options.requireSpecialChars && this.options.specialChars) {
      const hasSpecialChar = this.options.specialChars
        .split('')
        .some(char => password.includes(char));
        
      if (!hasSpecialChar) {
        errors.push(`Senha deve conter pelo menos um caractere especial (${this.options.specialChars})`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Senha não atende aos critérios de segurança',
        errors,
      });
    }
  }
}
