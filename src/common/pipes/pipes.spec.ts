import { BadRequestException } from '@nestjs/common';
import { TrimPipe } from './trim.pipe';
import { ParsePositiveIntPipe } from './parse-positive-int.pipe';
import { ParseOptionalIntPipe } from './parse-optional-int.pipe';
import { EmailNormalizationPipe } from './email-normalization.pipe';
import { PasswordValidationPipe } from './password-validation.pipe';

describe('Pipes', () => {
  describe('TrimPipe', () => {
    let pipe: TrimPipe;

    beforeEach(() => {
      pipe = new TrimPipe();
    });

    it('deve remover espaços em branco de strings', () => {
      expect(pipe.transform('  hello world  ', {} as any)).toBe('hello world');
    });

    it('deve processar objetos recursivamente', () => {
      const input = {
        name: '  John  ',
        email: '  john@example.com  ',
        nested: {
          field: '  value  ',
        },
      };

      const expected = {
        name: 'John',
        email: 'john@example.com',
        nested: {
          field: 'value',
        },
      };

      expect(pipe.transform(input, {} as any)).toEqual(expected);
    });

    it('deve processar arrays', () => {
      const input = ['  item1  ', '  item2  '];
      const expected = ['item1', 'item2'];

      expect(pipe.transform(input, {} as any)).toEqual(expected);
    });

    it('deve manter valores null e undefined', () => {
      expect(pipe.transform(null, {} as any)).toBeNull();
      expect(pipe.transform(undefined, {} as any)).toBeUndefined();
    });
  });

  describe('ParsePositiveIntPipe', () => {
    let pipe: ParsePositiveIntPipe;

    beforeEach(() => {
      pipe = new ParsePositiveIntPipe();
    });

    it('deve converter string válida para número positivo', () => {
      expect(pipe.transform('5', {} as any)).toBe(5);
      expect(pipe.transform('100', {} as any)).toBe(100);
    });

    it('deve rejeitar números negativos', () => {
      expect(() => pipe.transform('-5', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar zero', () => {
      expect(() => pipe.transform('0', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar strings não numéricas', () => {
      expect(() => pipe.transform('abc', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar valores vazios', () => {
      expect(() => pipe.transform('', {} as any)).toThrow(BadRequestException);
    });
  });

  describe('ParseOptionalIntPipe', () => {
    let pipe: ParseOptionalIntPipe;

    beforeEach(() => {
      pipe = new ParseOptionalIntPipe(1, 10);
    });

    it('deve retornar undefined para valores não fornecidos', () => {
      expect(pipe.transform(undefined, {} as any)).toBeUndefined();
      expect(pipe.transform('', {} as any)).toBeUndefined();
    });

    it('deve converter e validar valores dentro do range', () => {
      expect(pipe.transform('5', {} as any)).toBe(5);
      expect(pipe.transform('1', {} as any)).toBe(1);
      expect(pipe.transform('10', {} as any)).toBe(10);
    });

    it('deve rejeitar valores fora do range', () => {
      expect(() => pipe.transform('0', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('11', {} as any)).toThrow(BadRequestException);
    });
  });

  describe('EmailNormalizationPipe', () => {
    let pipe: EmailNormalizationPipe;

    beforeEach(() => {
      pipe = new EmailNormalizationPipe();
    });

    it('deve normalizar email válido', () => {
      expect(pipe.transform('  TEST@EXAMPLE.COM  ', {} as any)).toBe('test@example.com');
      expect(pipe.transform('User@Domain.com', {} as any)).toBe('user@domain.com');
    });

    it('deve remover espaços internos', () => {
      expect(pipe.transform('test @ example.com', {} as any)).toBe('test@example.com');
    });

    it('deve rejeitar emails inválidos', () => {
      expect(() => pipe.transform('invalid-email', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar valores não string', () => {
      expect(() => pipe.transform(123, {} as any)).toThrow(BadRequestException);
    });
  });

  describe('PasswordValidationPipe', () => {
    let pipe: PasswordValidationPipe;

    beforeEach(() => {
      pipe = new PasswordValidationPipe();
    });

    it('deve aceitar senha válida', () => {
      const validPassword = 'Test123!';
      expect(pipe.transform(validPassword, {} as any)).toBe(validPassword);
    });

    it('deve rejeitar senha muito curta', () => {
      expect(() => pipe.transform('Test1!', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar senha sem maiúscula', () => {
      expect(() => pipe.transform('test123!', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar senha sem minúscula', () => {
      expect(() => pipe.transform('TEST123!', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar senha sem número', () => {
      expect(() => pipe.transform('TestTest!', {} as any)).toThrow(BadRequestException);
    });

    it('deve rejeitar senha sem caractere especial', () => {
      expect(() => pipe.transform('Test1234', {} as any)).toThrow(BadRequestException);
    });

    it('deve customizar critérios', () => {
      const customPipe = new PasswordValidationPipe({
        minLength: 4,
        requireUppercase: false,
        requireSpecialChars: false,
      });

      expect(customPipe.transform('test1', {} as any)).toBe('test1');
    });

    it('deve trimmar a senha', () => {
      const password = '  Test123!  ';
      expect(pipe.transform(password, {} as any)).toBe('Test123!');
    });
  });
});
