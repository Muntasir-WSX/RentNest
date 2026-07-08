import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { Role } from "../../../prisma/generated/prisma/client";
import type { AuthTokenPayload } from "./auth.tokens";
import { createAuthTokens } from "./auth.tokens";
import type { LoginInput, RegisterInput } from "./auth.validation";

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isBanned: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function buildAuthPayload(user: Pick<SelectedUser, "id" | "email" | "role">): AuthTokenPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

function buildAuthResponse(user: SelectedUser) {
  const tokens = createAuthTokens(buildAuthPayload(user));

  return {
    user,
    ...tokens,
  };
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      ...userSelect,
      password: true,
    },
  });
}

export async function registerUser(input: RegisterInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { conflict: true as const };
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: input.phone?.trim() || null,
      role: input.role,
    },
    select: userSelect,
  });

  return { conflict: false as const, ...buildAuthResponse(createdUser) };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email.trim().toLowerCase());

  if (!user) {
    return { invalidCredentials: true as const };
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    return { invalidCredentials: true as const };
  }

  if (user.isBanned) {
    return { banned: true as const };
  }

  const { password: _password, ...safeUser } = user;

  return { invalidCredentials: false as const, banned: false as const, ...buildAuthResponse(safeUser) };
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
}