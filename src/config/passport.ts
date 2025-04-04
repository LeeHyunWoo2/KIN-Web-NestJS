// 소셜 인증 전략 설정 파일
import { PassportStatic } from "passport";

import { configureSocialStrategies } from "@/services/auth/socialAuthStrategy";
import { configureLinkingStrategies } from "@/services/auth/linkSocialStrategy";

export const passportStrategy = (passport : PassportStatic) => {
  // 소셜 로그인 인증 전략
  configureSocialStrategies(passport);

  // 일반계정에 소셜 계정 추가 연동용 인증 전략
  configureLinkingStrategies(passport);
};