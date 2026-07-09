import type { Request, Response } from "express";
import httpStatus from "http-status";
import { RequestStatus } from "@prisma/client";
import { prisma } from '../../lib/prisma.js';
import { sendError, sendSuccess } from '../../utils/apiResponse.js';

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  return items;
}

function parsePropertyBody(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  const price = Number(body.price);
  const images = parseStringArray(body.images);
  const amenities = parseStringArray(body.amenities);

  if (!title) {
    errors.title = "Title is required.";
  }

  if (!description) {
    errors.description = "Description is required.";
  }

  if (!location) {
    errors.location = "Location is required.";
  }

  if (!categoryId) {
    errors.categoryId = "categoryId is required.";
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Price must be a valid positive number.";
  }

  if (!images || images.length === 0) {
    errors.images = "At least one image is required.";
  }

  if (!amenities) {
    errors.amenities = "Amenities must be an array of strings.";
  }

  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      title,
      description,
      location,
      categoryId,
      price,
      images: images ?? [],
      amenities: amenities ?? [],
      isAvailable,
    },
  };
}

export async function createLandlordProperty(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const validation = parsePropertyBody(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const category = await prisma.category.findUnique({ where: { id: validation.value.categoryId } });

  if (!category) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Category not found", { categoryId: "No category found for this id." }),
    );
  }

  const property = await prisma.property.create({
    data: {
      ...validation.value,
      landlordId: req.user.userId,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return res.status(httpStatus.CREATED).json(
    sendSuccess(property, "Property created successfully"),
  );
}

export async function updateLandlordProperty(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const propertyId = String(req.params.id || "").trim();

  if (!propertyId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "Property id is required." }),
    );
  }

  const existing = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!existing) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Property not found", { id: "No property found for this id." }),
    );
  }

  if (existing.landlordId !== req.user.userId) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", { property: "You can only update your own property." }),
    );
  }

  const validation = parsePropertyBody(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: validation.value,
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(updated, "Property updated successfully"),
  );
}

export async function deleteLandlordProperty(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const propertyId = String(req.params.id || "").trim();

  if (!propertyId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "Property id is required." }),
    );
  }

  const existing = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!existing) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Property not found", { id: "No property found for this id." }),
    );
  }

  if (existing.landlordId !== req.user.userId) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", { property: "You can only delete your own property." }),
    );
  }

  await prisma.property.delete({ where: { id: propertyId } });

  return res.status(httpStatus.OK).json(
    sendSuccess(null, "Property deleted successfully"),
  );
}

export async function getLandlordRequests(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const requests = await prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId: req.user.userId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: { id: true, name: true, email: true, phone: true },
      },
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(requests, "Landlord rental requests fetched successfully"),
  );
}

export async function updateLandlordRequestStatus(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const requestId = String(req.params.id || "").trim();
  const status = (req.body as Record<string, unknown>).status;

  if (!requestId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { id: "Rental request id is required." }),
    );
  }

  if (status !== RequestStatus.APPROVED && status !== RequestStatus.REJECTED) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", { status: "Status must be APPROVED or REJECTED." }),
    );
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: requestId },
    include: {
      property: { select: { landlordId: true } },
    },
  });

  if (!rentalRequest) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Rental request not found", { id: "No request found for this id." }),
    );
  }

  if (rentalRequest.property.landlordId !== req.user.userId) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", { request: "You can only manage requests for your properties." }),
    );
  }

  const updated = await prisma.rentalRequest.update({
    where: { id: requestId },
    data: { status },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(updated, "Rental request status updated successfully"),
  );
}