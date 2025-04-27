import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { SocialAccount } from '@/user/entity/social-account.entity';

import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, SocialAccount])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
