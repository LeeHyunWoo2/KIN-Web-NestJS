"use strict";
const express = require('express');
const router = express.Router();
const { sendVerificationEmail, verifyEmail } = require('../../controllers/user/emailController');
// 이메일 인증 확인
router.get('/', verifyEmail);
// 이메일 인증 링크 전송
router.post('/', sendVerificationEmail);
module.exports = router;
