import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ExceptionCode } from '@/common/constants/exception-code.enum';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: '사용자를 찾을 수 없습니다.',
      code: ExceptionCode.USER_NOT_FOUND,
    });
  }
}

export class NoRemainingAuthMethodException extends BadRequestException {
  constructor() {
    super({
      message: '최소 하나 이상의 로그인 방식이 유지되어야 합니다.',
      code: ExceptionCode.NO_REMAINING_AUTH,
    });
  }
}
