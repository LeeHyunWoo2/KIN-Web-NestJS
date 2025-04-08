import {SafeUserInfo, UserRole} from "@/types/User";

export interface PublicUserDataResponseDto {
  name: string,
  email: string,
  profileIcon: string,
  userId: string,
  role: UserRole,
}

export interface UserInfoResponseDto {
  user: SafeUserInfo
}