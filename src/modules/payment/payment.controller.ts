import type { Request, Response } from "express";
import httpStatus from "http-status";
import { sendError, sendSuccess } from '../../utils/apiResponse.js';
import {
  confirmPayment,
  createPaymentSession,
  getPaymentById,
  getUserPayments,
} from './payment.service.js';
import {
  validateConfirmPaymentInput,
  validateCreatePaymentInput,
} from './payment.validation.js';

export async function createPayment(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", {
        authorization: "Missing access token.",
      }),
    );
  }

  const validation = validateCreatePaymentInput(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const result = await createPaymentSession(req.user.userId, validation.value);

  if (result.status === "not_found") {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Rental request not found", {
        rentalRequestId: "No rental request found for this id.",
      }),
    );
  }

  if (result.status === "forbidden") {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", {
        tenant: "You can only pay for your own rental request.",
      }),
    );
  }

  if (result.status === "not_approved") {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Rental request is not approved", {
        status: "Payment can be created only for APPROVED requests.",
      }),
    );
  }

  if (result.status === "already_paid") {
    return res.status(httpStatus.CONFLICT).json(
      sendError("Rental request already paid", {
        payment: "A completed payment already exists for this request.",
      }),
    );
  }

  return res.status(httpStatus.CREATED).json(
    sendSuccess(
      {
        payment: result.payment,
        clientSecret: result.clientSecret,
      },
      "Payment intent created successfully",
    ),
  );
}

export async function confirmPaymentStatus(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", {
        authorization: "Missing access token.",
      }),
    );
  }

  const validation = validateConfirmPaymentInput(req.body as Record<string, unknown>);

  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", validation.errors),
    );
  }

  const result = await confirmPayment(req.user.userId, req.user.role, validation.value);

  if (result.status === "not_found") {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Payment not found", {
        transactionId: "No payment found for this transaction id.",
      }),
    );
  }

  if (result.status === "forbidden") {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", {
        payment: "You do not have access to this payment.",
      }),
    );
  }

  if (result.status === "unsupported_provider") {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Unsupported provider", {
        provider: "Only STRIPE payments can be confirmed here.",
      }),
    );
  }

  if (result.status === "not_completed") {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Payment not completed yet", {
        stripeStatus: result.stripeStatus,
      }),
    );
  }

  return res.status(httpStatus.OK).json(
    sendSuccess(result.payment, "Payment confirmed successfully"),
  );
}

export async function listPayments(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", {
        authorization: "Missing access token.",
      }),
    );
  }

  const payments = await getUserPayments(req.user.userId, req.user.role);

  return res.status(httpStatus.OK).json(
    sendSuccess(payments, "Payments fetched successfully"),
  );
}

export async function paymentDetails(req: Request, res: Response) {
  if (!req.user) {
    return res.status(httpStatus.UNAUTHORIZED).json(
      sendError("Authentication required", {
        authorization: "Missing access token.",
      }),
    );
  }

  const paymentId = String(req.params.id || "").trim();

  if (!paymentId) {
    return res.status(httpStatus.BAD_REQUEST).json(
      sendError("Validation failed", {
        id: "Payment id is required.",
      }),
    );
  }

  const result = await getPaymentById(paymentId, req.user.userId, req.user.role);

  if (result.status === "not_found") {
    return res.status(httpStatus.NOT_FOUND).json(
      sendError("Payment not found", {
        id: "No payment found for this id.",
      }),
    );
  }

  if (result.status === "forbidden") {
    return res.status(httpStatus.FORBIDDEN).json(
      sendError("Forbidden", {
        payment: "You do not have access to this payment.",
      }),
    );
  }

  return res.status(httpStatus.OK).json(
    sendSuccess(result.payment, "Payment fetched successfully"),
  );
}