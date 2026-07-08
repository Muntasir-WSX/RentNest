import type { Request, Response } from "express";
import httpStatus from "http-status";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { registerUser } from "./auth.service";
import { validateRegisterInput } from "./auth.validation";



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

  return res.status(httpStatus.CREATED).json(
    sendSuccess(result.user, "User registered successfully"),
  );
}



