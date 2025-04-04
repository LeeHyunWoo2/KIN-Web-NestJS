import jwt from "jsonwebtoken";
import {UserRole} from "./User";

export interface AccessTokenUserPayload {
  _id: string;
  email: string;
  role: UserRole;
}

export interface TokenTypes {
  accessToken: string;
  refreshToken: string;
  refreshTokenTTL: number;
}

export interface RefreshTokenPayload {
  id: string;
}

export interface EmailTokenPayload extends jwt.JwtPayload{
  email?: string;
}