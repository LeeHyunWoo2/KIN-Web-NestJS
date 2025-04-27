import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { User } from './user.entity';

@Entity()
@Unique({ properties: ['provider', 'providerId'] })
export class SocialAccount {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @Property()
  provider!: 'google' | 'kakao' | 'naver' | 'local';

  @Property()
  providerId!: string;

  @Property({ nullable: true })
  socialRefreshToken?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
