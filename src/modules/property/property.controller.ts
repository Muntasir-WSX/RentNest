import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { sendError, sendSuccess } from "../../utils/apiResponse";

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function getProperties(req: Request, res: Response) {
  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);
  const location = typeof req.query.location === "string" ? req.query.location.trim() : undefined;
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : undefined;

  const properties = await prisma.property.findMany({
    where: {
      isAvailable: true,
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(minPrice !== null || maxPrice !== null
        ? {
            price: {
              ...(minPrice !== null ? { gte: minPrice } : {}),
              ...(maxPrice !== null ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { id: true, name: true },
      },
      landlord: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(properties, "Properties fetched successfully"),
  );
}

export async function getPropertyById(req: Request, res: Response) {
  const propertyId = String(req.params.id || "").trim();

  if (!propertyId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "Property id is required." }),
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      category: {
        select: { id: true, name: true },
      },
      landlord: {
        select: { id: true, name: true, email: true, phone: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          tenant: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!property) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Property not found", { id: "No property found for this id." }),
    );
  }

  return res.status(httpStatus.OK).json(
    sendSuccess(property, "Property fetched successfully"),
  );
}