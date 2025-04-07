import {DecodedUser, UserTypes} from '../User';

declare global {
  namespace Express {
    interface User extends DecodedUser {}
    interface Request {
      user?: DecodedUser;
      authResult?: {
        error?: unknown;
        user?: UserTypes;
      };
      headers?: {
        [key: string]: string | undefined;
        'x-skip-interceptor'?: string;
      };
      realIp?: string;
    }
  }
}

export {};
