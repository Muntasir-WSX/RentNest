import { Role } from "../../../prisma/generated/prisma/client";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function validateRegisterInput(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long.";
  }

  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "A valid email is required.";
  }

  if (typeof body.password !== "string" || body.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (typeof body.phone !== "undefined" && typeof body.phone !== "string") {
    errors.phone = "Phone must be a string if provided.";
  }

  if (body.role !== Role.TENANT && body.role !== Role.LANDLORD) {
    errors.role = "Role must be TENANT or LANDLORD.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginInput(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "A valid email is required.";
  }

  if (typeof body.password !== "string" || body.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}