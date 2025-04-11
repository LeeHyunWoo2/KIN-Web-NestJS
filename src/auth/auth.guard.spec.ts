import { TokenService } from '@/auth/services/token.service';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('should be defined', () => {
    expect(new AuthGuard({} as TokenService)).toBeDefined();
  });
});
