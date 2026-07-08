import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { RegisterInput } from "./auth.validation";

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    return { conflict: true as const };
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      password: hashedPassword,
      phone: input.phone?.trim() || null,
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBanned: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { conflict: false as const, user: createdUser };
}