import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { sendError } from '../utils/apiResponse.js';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';
import { Role } from "@prisma/client";

function getBearerToken(req: Request) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req) ?? (typeof req.cookies?.accessToken === "string" ? req.cookies.accessToken : null);

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json(
        sendError("Authentication required", {
          authorization: "Missing access token.",
        }),
      );
    }

    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Invalid or expired access token", {
        authorization: "Please login again.",
      }),
    );
  }
}

export function requireRole(...allowedRoles: Array<Role>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(httpStatus.UNAUTHORIZED).json(
        sendError("Authentication required", {
          authorization: "Missing access token.",
        }),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(httpStatus.FORBIDDEN).json(
        sendError("Forbidden", {
          role: "You do not have permission to access this resource.",
        }),
      );
    }

    return next();
  };
}