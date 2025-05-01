import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { ExceptionCode } from '@/common/constants/exception-code.enum';

export class AccessTokenMissingException extends UnauthorizedException {
  constructor() {
    super({
      message: '로그인이 필요합니다.',
      code: ExceptionCode.ACCESS_TOKEN_MISSING,
    });
  }
}

export class AccessTokenBlacklistedException extends UnauthorizedException {
  constructor() {
    super({
      message: '세션이 만료되었습니다.',
      code: ExceptionCode.ACCESS_TOKEN_BLACKLISTED,
    });
  }
}

export class AccessTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({
      message: '토큰이 유효하지 않습니다.',
      code: ExceptionCode.ACCESS_TOKEN_INVALID,
    });
  }
}

export class NoLinkedAccountException extends UnauthorizedException {
  constructor() {
    super({
      message: '해당 소셜 계정과의 연결 정보가 없습니다.',
      code: ExceptionCode.NO_LINKED_ACCOUNT,
    });
  }
}

export class OAuthTokenGenerationFailedException extends UnauthorizedException {
  constructor() {
    super({
      message: '소셜 인증 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      code: ExceptionCode.OAUTH_TOKEN_GENERATION_FAILED,
    });
  }
}

export class RefreshTokenNotFoundException extends UnauthorizedException {
  constructor() {
    super({
      message: '로그인이 필요합니다.',
      code: ExceptionCode.REFRESH_TOKEN_NOT_FOUND,
    });
  }
}

export class RefreshTokenMismatchException extends UnauthorizedException {
  constructor() {
    super({
      message: '로그인이 필요합니다.',
      code: ExceptionCode.REFRESH_TOKEN_MISMATCH,
    });
  }
}
export class RefreshTokenMissingException extends UnauthorizedException {
  constructor() {
    super({
      message: '로그인이 필요합니다.',
      code: ExceptionCode.REFRESH_TOKEN_MISSING,
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
