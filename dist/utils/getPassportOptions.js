"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPassportOptions = void 0;
const getPassportOptions = (provider, mode = 'login') => {
    const isLink = mode === 'link' || mode === 'link-callback';
    const strategy = isLink ? `${provider}-link` : provider;
    const commonOptions = {
        scope: getScopeForProvider(provider),
        accessType: 'offline',
        prompt: 'consent',
    };
    return {
        strategy,
        options: commonOptions,
    };
};
exports.getPassportOptions = getPassportOptions;
const getScopeForProvider = (provider) => {
    switch (provider) {
        case 'google':
            return ['profile', 'email'];
        case 'kakao':
            return ['account_email', 'profile_nickname'];
        case 'naver':
            return ['name', 'email'];
        default:
            throw new Error(`지원하지 않는 플랫폼 : ${provider}`);
    }
};
