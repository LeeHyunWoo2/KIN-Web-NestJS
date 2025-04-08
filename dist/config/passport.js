"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportStrategy = void 0;
const socialAuthStrategy_1 = require("@/services/auth/socialAuthStrategy");
const linkSocialStrategy_1 = require("@/services/auth/linkSocialStrategy");
const passportStrategy = (passport) => {
    // 소셜 로그인 인증 전략
    (0, socialAuthStrategy_1.configureSocialStrategies)(passport);
    // 일반계정에 소셜 계정 추가 연동용 인증 전략
    (0, linkSocialStrategy_1.configureLinkingStrategies)(passport);
};
exports.passportStrategy = passportStrategy;
