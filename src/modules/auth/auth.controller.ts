import type { Request, Response } from "express";
import httpStatus from "http-status";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { getCurrentUser, loginUser, registerUser } from "./auth.service";
import { validateLoginInput, validateRegisterInput } from "./auth.validation";
import { createAuthTokens, verifyRefreshToken } from "./auth.tokens";

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie("refreshToken", {
    path: "/api/auth",
  });
}

export async function register(req: Request, res: Response) {
  const validation = validateRegisterInput(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const result = await registerUser({
    name: String(req.body.name),
    email: String(req.body.email),
    password: String(req.body.password),
    phone: typeof req.body.phone === "string" ? req.body.phone : undefined,
    role: req.body.role,
  });

  if (result.conflict) {
    return res.status(httpStatus.CONFLICT).json(
      sendError("Email already exists", {
        email: "This email is already registered.",
      }),
    );
  }

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(httpStatus.CREATED).json(
    sendSuccess(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "User registered successfully",
    ),
  );
}

export async function login(req: Request, res: Response) {
  const validation = validateLoginInput(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const result = await loginUser({
    email: String(req.body.email),
    password: String(req.body.password),
  });

  if (result.banned) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("User is banned", {
        account: "This account is currently banned.",
      }),
    );
  }

  if (result.invalidCredentials) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Invalid email or password", {
        credentials: "Please check your login details.",
      }),
    );
  }

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(httpStatus.OK).json(
    sendSuccess(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login successful",
    ),
  );
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = typeof req.cookies?.refreshToken === "string"
    ? req.cookies.refreshToken
    : null;

  if (!refreshToken) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Refresh token missing", {
        refreshToken: "Please login again.",
      }),
    );
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await getCurrentUser(payload.userId);

    if (!user) {
      clearRefreshTokenCookie(res);

      return res.status(httpStatus.UNAUTHORIZED).json(
        sendError("User not found", {
          refreshToken: "Please login again.",
        }),
      );
    }

    if (user.isBanned) {
      clearRefreshTokenCookie(res);

      return res.status(httpStatus.FORBIDDEN).json(
        sendError("User is banned", {
          account: "This account is currently banned.",
        }),
      );
    }

      const tokens = createAuthTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      setRefreshTokenCookie(res, tokens.refreshToken);

    return res.status(httpStatus.OK).json(
      sendSuccess(
        {
          user,
            accessToken: tokens.accessToken,
        },
        "Token refreshed successfully",
      ),
    );
  } catch {
    clearRefreshTokenCookie(res);

    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Invalid or expired refresh token", {
        refreshToken: "Please login again.",
      }),
    );
  }
}

export async function logout(req: Request, res: Response) {
  clearRefreshTokenCookie(res);

  return res.status(httpStatus.OK).json(
    sendSuccess(null, "Logout successful"),
  );
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", {
        authorization: "Missing access token.",
      }),
    );
  }

  const user = await getCurrentUser(req.user.userId);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("User not found", {
        userId: "No user matches the current token.",
      }),
    );
  }

  return res.status(httpStatus.OK).json(
    sendSuccess(user, "Current user fetched successfully"),
  );
}



