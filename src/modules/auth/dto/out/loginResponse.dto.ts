import { UserProfileResponseDto } from './userProfileResponse.dto';

export class LoginResponseDto {
  user: UserProfileResponseDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;

  constructor(
    user: UserProfileResponseDto,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}

