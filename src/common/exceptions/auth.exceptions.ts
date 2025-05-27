import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { ExceptionCode } from '@/common/constants/exception-code.enum';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: '아이디 또는 비밀번호가 일치하지 않습니다.',
      code: ExceptionCode.INVALID_CREDENTIALS,
    });
  }
}

export class AlreadyLinkedException extends ConflictException {
  constructor() {
    super({
      message: '이미 연동된 계정입니다.',
      code: ExceptionCode.ALREADY_LINKED,
    });
  }
}

export class UsernameAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      message: '이미 사용 중인 아이디입니다.',
      code: ExceptionCode.USERNAME_ALREADY_USED,
    });
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      message: '이미 사용 중인 이메일입니다.',
      code: ExceptionCode.EMAIL_ALREADY_USED,
    });
  }
}

export class InvalidEmailTokenException extends UnauthorizedException {
  constructor() {
    super({
      code: ExceptionCode.EMAIL_TOKEN_INVALID,
      message: '이메일 인증이 유효하지 않습니다.',
    });
  }
}

export class EmailSendFailedException extends InternalServerErrorException {
  constructor() {
    super({
      code: ExceptionCode.EMAIL_SEND_FAILED,
      message: '이메일 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
}

export class MissingSocialEmailException extends InternalServerErrorException {
  constructor() {
    super({
      message: '소셜 로그인 계정에서 이메일 정보를 가져올 수 없습니다.',
      code: ExceptionCode.MISSING_SOCIAL_EMAIL,
    });
  }
}
