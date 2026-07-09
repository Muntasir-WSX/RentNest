import jwt, { type JwtPayload } from "jsonwebtoken";
import config from '../../config';
import { Role } from "@prisma/client";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

function getRequiredValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function isJwtPayload(payload: string | JwtPayload): payload is JwtPayload {
  return typeof payload === "object" && payload !== null;
}

function toAuthTokenPayload(payload: string | JwtPayload): AuthTokenPayload {
  if (!isJwtPayload(payload)) {
    throw new Error("Invalid token payload");
  }

  const { userId, email, role } = payload as Partial<AuthTokenPayload>;

  if (typeof userId !== "string" || typeof email !== "string" || role !== Role.TENANT && role !== Role.LANDLORD && role !== Role.ADMIN) {
    throw new Error("Invalid token payload");
  }

  return { userId, email, role };
}

function signToken(payload: AuthTokenPayload, secret: string | undefined, expiresIn: string | undefined) {
  return jwt.sign(payload, getRequiredValue(secret, "JWT secret"), {
    expiresIn: (expiresIn ?? "15m") as jwt.SignOptions["expiresIn"],
  });
}

export function createAuthTokens(payload: AuthTokenPayload) {
  return {
    accessToken: signToken(
      payload,
      config.jwt_access_secret,
      config.jwt_access_expiration_in,
    ),
    refreshToken: signToken(
      payload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expiration_in,
    ),
  };
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, getRequiredValue(config.jwt_access_secret, "JWT access secret"));

  return toAuthTokenPayload(payload);
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, getRequiredValue(config.jwt_refresh_secret, "JWT refresh secret"));

  return toAuthTokenPayload(payload);
}