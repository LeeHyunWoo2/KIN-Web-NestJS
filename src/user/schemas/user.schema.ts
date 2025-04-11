import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { PasswordHistoryTypes, SocialAccountTypes, UserRole } from '@/types/user.types';

export type UserDocument = HydratedDocument<User>;

@Schema({ versionKey: false, timestamps: { createdAt: true, updatedAt: true } })
export class User {
  @Prop({ unique: true, sparse: true, required: false })
  username?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ type: [{ password: String, changedAt: Date }], default: [] })
  passwordHistory?: PasswordHistoryTypes[];

  @Prop({ required: false })
  termsAgreed?: boolean;

  @Prop({ required: false, default: false })
  marketingConsent?: boolean;

  @Prop({ type: [{ provider: String, providerId: String, socialRefreshToken: String }] })
  socialAccounts: SocialAccountTypes[];

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: UserRole;

  @Prop({
    default:
      'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg',
  })
  profileIcon?: string;

  @Prop({
    type: [{ url: String, queuedAt: { type: Date, default: Date.now, immutable: true } }],
    default: [],
  })
  deleteQueue?: { url: string; queuedAt: Date }[];

  @Prop()
  lastActivity?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
