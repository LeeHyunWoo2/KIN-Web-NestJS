import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

import { ExceptionCode } from '@/common/constants/exception-code.enum';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: '사용자를 찾을 수 없습니다.',
      code: ExceptionCode.USER_NOT_FOUND,
    });
  }
}

export class SamePasswordUsedException extends BadRequestException {
  constructor() {
    super({
      message: '현재 비밀번호와 다르게 설정해주세요.',
      code: ExceptionCode.SAME_PASSWORD_USED,
    });
  }
}

export class PasswordReusedException extends BadRequestException {
  constructor(message: string) {
    super({
      message,
      code: ExceptionCode.PASSWORD_REUSED,
    });
  }
}

export class AlreadyHasLocalAccountException extends BadRequestException {
  constructor() {
    super({
      message: '이미 로컬 계정이 존재합니다.',
      code: ExceptionCode.ALREADY_HAS_LOCAL_ACCOUNT,
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
export class TestAccountMutationException extends HttpException {
  constructor() {
    super(
      {
        message: '테스트 계정은 변경할 수 없습니다.',
        code: ExceptionCode.TEST_ACCOUNT_MUTATION,
      },
      HttpStatus.I_AM_A_TEAPOT,
    );
  }
}
