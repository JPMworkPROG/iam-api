import { FindOneResponseDto } from './findOneResponse.dto';

export class FindManyResponseDto {
  payload: FindOneResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(
    payload: FindOneResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.payload = payload;
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

