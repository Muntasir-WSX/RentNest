import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from '../../lib/prisma.js';
import { sendError, sendSuccess } from '../../utils/apiResponse.js';

export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return res.status(httpStatus.OK).json(
    sendSuccess(users, "Users fetched successfully"),
  );
}

export async function updateUserStatus(req: Request, res: Response) {
  const userId = String(req.params.id || "").trim();
  const isBanned = (req.body as Record<string, unknown>).isBanned;

  if (!userId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "User id is required." }),
    );
  }

  if (typeof isBanned !== "boolean") {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { isBanned: "isBanned must be boolean." }),
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("User not found", { id: "No user found for this id." }),
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBanned: true,
      updatedAt: true,
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(updated, "User status updated successfully"),
  );
}

export async function getAllPropertiesForAdmin(req: Request, res: Response) {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      landlord: {
        select: { id: true, name: true, email: true },
      },
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(properties, "Properties fetched successfully"),
  );
}

export async function getAllRentalsForAdmin(req: Request, res: Response) {
  const rentals = await prisma.rentalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
      payments: {
        select: {
          id: true,
          provider: true,
          status: true,
          transactionId: true,
          paidAt: true,
        },
      },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(rentals, "Rentals fetched successfully"),
  );
}