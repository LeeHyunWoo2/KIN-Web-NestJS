"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const socialController_1 = require("@/controllers/auth/socialController");
const injectAuthenticatedUser_1 = require("@/middleware/auth/injectAuthenticatedUser");
const getPassportOptions_1 = require("@/utils/getPassportOptions");
const socialRouter = (0, express_1.Router)();
exports.socialRouter = socialRouter;
// 소셜 로그인 진입
socialRouter.get('/:provider', (req, res, next) => {
    const provider = req.params.provider;
    try {
        const { strategy, options } = (0, getPassportOptions_1.getPassportOptions)(provider, 'login');
        passport_1.default.authenticate(strategy, options)(req, res, next);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400);
        }
    }
});
// 소셜 로그인 콜백
socialRouter.get('/callback/:provider', (req, res) => {
    const provider = req.params.provider;
    try {
        const { strategy, options } = (0, getPassportOptions_1.getPassportOptions)(provider, 'login-callback');
        passport_1.default.authenticate(strategy, options)(req, res, async () => {
            await (0, socialController_1.handleSocialCallback)(req, res);
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400);
        }
    }
});
// 일반 계정에 소셜 계정 추가 연동
socialRouter.get('/link/:provider', injectAuthenticatedUser_1.injectAuthenticatedUser, (req, res, next) => {
    const provider = req.params.provider;
    try {
        const { strategy, options } = (0, getPassportOptions_1.getPassportOptions)(provider, 'link');
        passport_1.default.authenticate(strategy, options)(req, res, next);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400);
        }
    }
});
// 추가 연동 콜백
socialRouter.get('/link/callback/:provider', injectAuthenticatedUser_1.injectAuthenticatedUser, (req, res) => {
    const provider = req.params.provider;
    try {
        const { strategy, options } = (0, getPassportOptions_1.getPassportOptions)(provider, 'link-callback');
        passport_1.default.authenticate(strategy, options)(req, res, () => {
            (0, socialController_1.handleSocialLinkCallback)(req, res);
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400);
        }
    }
});
// 소셜 계정 연동 해제
socialRouter.delete('/:provider', injectAuthenticatedUser_1.injectAuthenticatedUser, socialController_1.unlinkSocialAccount);
