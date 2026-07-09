import { PaymentProvider } from "@prisma/client";

export type CreatePaymentInput = {
  rentalRequestId: string;
  provider: PaymentProvider;
};

export type ConfirmPaymentInput = {
  transactionId: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCreatePaymentInput(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(body.rentalRequestId)) {
    errors.rentalRequestId = "rentalRequestId is required.";
  }

  if (typeof body.provider !== "undefined" && body.provider !== PaymentProvider.STRIPE) {
    errors.provider = "Only STRIPE provider is supported right now.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      rentalRequestId: isNonEmptyString(body.rentalRequestId) ? body.rentalRequestId.trim() : "",
      provider: body.provider === PaymentProvider.STRIPE
        ? PaymentProvider.STRIPE
        : PaymentProvider.STRIPE,
    } satisfies CreatePaymentInput,
  };
}

export function validateConfirmPaymentInput(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(body.transactionId)) {
    errors.transactionId = "transactionId is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      transactionId: isNonEmptyString(body.transactionId) ? body.transactionId.trim() : "",
    } satisfies ConfirmPaymentInput,
  };
}