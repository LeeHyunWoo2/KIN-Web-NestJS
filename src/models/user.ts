import { Schema, model, models } from 'mongoose';
import { UserTypes } from "@/types/User";

const UserSchema = new Schema<UserTypes>({
  id: {
    type: String,
    required: false, // 소셜 only 계정은 id가 없음
    unique: true,
    sparse: true, // null 은 무시
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // 소셜 only 계정은 pw가 없음
  },
  passwordHistory: {
    type: [
      {
        password: {
          type: String,
        }, // 변경 전 비밀번호 저장
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    default: [],
  },
  termsAgreed: {
    type: Boolean,
    required: false,
  },
  marketingConsent: {
    type: Boolean,
    required: false,
    default: false,
  },
  socialAccounts: [
    {
      provider: {
        type: String, // google, kakao, naver, local
        required: true,
      },
      providerId: {
        type: String, // 소셜 플랫폼측 고유 ID
        required: true,
        unique: true,
      },
      socialRefreshToken: {
        type: String,
        required: false,
      }
    }
  ],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profileIcon: {
    type: String,
    default: 'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg'
  },
  deleteQueue:{
    type:[
      {
        url: {
          type: String,
          required: true,
        },
        queuedAt: {
          type: Date,
          default: Date.now,
          immutable: true,
        },
      }
    ],
    default:[],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    required: false,
  }
}, {
  versionKey: false
});

export default models.User || model<UserTypes>('User', UserSchema);