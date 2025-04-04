import { Response } from 'express';
import { CookieOptions } from "express";

// 전역 쿠키 설정 함수
const setCookie = (
    res : Response,
    name : string,
    val : string,
    options : CookieOptions = {}
): void => {
  const defaultOptions : CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined,
  };
  res.cookie(name, val, { ...defaultOptions, ...options });
};

export default setCookie;