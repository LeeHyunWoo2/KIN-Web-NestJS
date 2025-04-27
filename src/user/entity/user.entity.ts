import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';

import { SocialAccount } from '@/user/entity/social-account.entity';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, nullable: true })
  username?: string;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  password?: string;

  @Property({ type: 'jsonb', nullable: true })
  passwordHistory?: { password: string; changedAt: Date }[];

  @Property({ default: false })
  marketingConsent = false;

  @Property({ default: 'user' })
  role: 'user' | 'admin' = 'user';

  @Property({
    default:
      'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg',
  })
  profileIcon =
    'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg';

  @Property({ type: 'jsonb', nullable: true })
  deleteQueue?: { url: string; queuedAt: Date }[];

  @Property({ nullable: true })
  lastActivity?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => SocialAccount, (socialAccount) => socialAccount.user)
  socialAccounts = new Collection<SocialAccount>(this);
}
