import { TokenService } from '@/auth/services/token.service';

import { AccessGuard } from './access.guard';

describe('AccessGuard', () => {
  it('should be defined', () => {
    expect(new AccessGuard({} as TokenService)).toBeDefined();
  });
});
