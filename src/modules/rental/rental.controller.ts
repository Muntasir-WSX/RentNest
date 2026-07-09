import type { Request, Response } from "express";
import httpStatus from "http-status";
import { RequestStatus } from "@prisma/client";
import { prisma } from '../../lib/prisma.js';
import { sendError, sendSuccess } from '../../utils/apiResponse.js';

function parseDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createRentalRequest(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const propertyId = typeof req.body.propertyId === "string" ? req.body.propertyId.trim() : "";
  const startDate = parseDate(req.body.startDate);
  const endDate = parseDate(req.body.endDate);

  const errors: Record<string, string> = {};

  if (!propertyId) {
    errors.propertyId = "propertyId is required.";
  }

  if (!startDate) {
    errors.startDate = "startDate must be a valid date string.";
  }

  if (!endDate) {
    errors.endDate = "endDate must be a valid date string.";
  }

  if (startDate && endDate && startDate >= endDate) {
    errors.dateRange = "startDate must be before endDate.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", errors),
    );
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!property) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Property not found", { propertyId: "No property found for this id." }),
    );
  }

  if (!property.isAvailable) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Property is not available", { property: "This property is currently unavailable." }),
    );
  }

  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      tenantId: req.user.userId,
      propertyId,
      startDate: startDate as Date,
      endDate: endDate as Date,
      status: RequestStatus.PENDING,
    },
    include: {
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
    },
  });

  return res.status(httpStatus.CREATED).json(
    sendSuccess(rentalRequest, "Rental request submitted successfully"),
  );
}

export async function getMyRentalRequests(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const requests = await prisma.rentalRequest.findMany({
    where: { tenantId: req.user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          transactionId: true,
          paidAt: true,
        },
      },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(requests, "Rental requests fetched successfully"),
  );
}

export async function getRentalRequestById(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const requestId = String(req.params.id || "").trim();

  if (!requestId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "Rental request id is required." }),
    );
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: requestId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          landlord: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      payments: true,
    },
  });

  if (!rentalRequest) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Rental request not found", { id: "No request found for this id." }),
    );
  }

  if (rentalRequest.tenantId !== req.user.userId) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", { request: "You can only access your own rental request." }),
    );
  }

  return res.status(httpStatus.OK).json(
    sendSuccess(rentalRequest, "Rental request fetched successfully"),
  );
}