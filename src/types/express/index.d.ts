import {UserTypes, DecodedUserTypes} from "../User";

declare global {
  namespace Express {
    interface User extends UserTypes {}
    interface Request {
      authResult?: {
        error?: unknown;
        user?: DecodedUserTypes;
      }
      user?: DecodedUserTypes;
      headers?: {
        [key: string]: string | undefined;
        'x-skip-interceptor'?: string;
      }
    }
  }
}

export {};