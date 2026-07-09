import type { Request, Response } from "express";
import httpStatus from "http-status";
import { RequestStatus } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { sendError, sendSuccess } from "../../utils/apiResponse";

export async function createReview(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", { authorization: "Missing access token." }),
    );
  }

  const rentalRequestId = typeof req.body.rentalRequestId === "string"
    ? req.body.rentalRequestId.trim()
    : "";
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

  const errors: Record<string, string> = {};

  if (!rentalRequestId) {
    errors.rentalRequestId = "rentalRequestId is required.";
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "rating must be an integer between 1 and 5.";
  }

  if (!comment) {
    errors.comment = "comment is required.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", errors),
    );
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: {
      review: true,
    },
  });

  if (!rentalRequest) {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Rental request not found", { rentalRequestId: "No request found for this id." }),
    );
  }

  if (rentalRequest.tenantId !== req.user.userId) {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", { review: "You can only review your own rental request." }),
    );
  }

  if (rentalRequest.status !== RequestStatus.COMPLETED) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Rental is not completed", { status: "Review is allowed only after COMPLETED status." }),
    );
  }

  if (rentalRequest.review) {
    return res.status(httpStatus.CONFLICT).json(
      sendError("Review already exists", { review: "You already reviewed this rental request." }),
    );
  }

  const review = await prisma.review.create({
    data: {
      tenantId: req.user.userId,
      propertyId: rentalRequest.propertyId,
      rentalRequestId,
      rating,
      comment,
    },
  });

  return res.status(httpStatus.CREATED).json(
    sendSuccess(review, "Review created successfully"),
  );
}