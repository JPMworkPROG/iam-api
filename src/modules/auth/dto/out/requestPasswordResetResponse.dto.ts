export class RequestPasswordResetResponseDto {
  message: string;
  token: string;
  expiresIn: number;

  constructor(message: string, token: string, expiresIn: number) {
    this.message = message;
    this.token = token;
    this.expiresIn = expiresIn;
  }
}

