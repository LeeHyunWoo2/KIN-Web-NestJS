import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { ExceptionCode } from '@/common/constants/exception-code.enum';

export class RefreshTokenNotFoundException extends UnauthorizedException {
  constructor() {
    super({
      message: '다시 로그인해주세요.',
      code: ExceptionCode.REFRESH_TOKEN_NOT_FOUND,
    });
  }
}

export class RefreshTokenMismatchException extends UnauthorizedException {
  constructor() {
    super({
      message: '다시 로그인해주세요.',
      code: ExceptionCode.REFRESH_TOKEN_MISMATCH,
    });
  }
}

export class RefreshTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({
      message: '세션이 만료되었습니다.',
      code: ExceptionCode.REFRESH_TOKEN_INVALID,
    });
  }
}

export class SaveRefreshTokenException extends InternalServerErrorException {
  constructor() {
    super({
      message: '문제가 발생했습니다. 다시 시도해주세요',
      code: ExceptionCode.REFRESH_TOKEN_SAVE_FAILED,
    });
  }
}
