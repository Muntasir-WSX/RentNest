import Stripe from "stripe";
import {
  PaymentProvider,
  PaymentStatus,
  RequestStatus,
  Role,
} from "@prisma/client";
import config from '../../config';
import { prisma } from '../../lib/prisma.js';
import type {
  ConfirmPaymentInput,
  CreatePaymentInput,
} from './payment.validation.js';

function getStripeClient() {
  if (!config.stripe_secret_key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(config.stripe_secret_key);
}

function toStripeAmount(price: unknown) {
  const numericAmount = Number(price);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid rental price for payment");
  }

  return Math.round(numericAmount * 100);
}

export async function createPaymentSession(userId: string, input: CreatePaymentInput) {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: input.rentalRequestId },
    include: {
      property: {
        select: {
          price: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!rentalRequest) {
    return { status: "not_found" as const };
  }

  if (rentalRequest.tenantId !== userId) {
    return { status: "forbidden" as const };
  }

  if (rentalRequest.status !== RequestStatus.APPROVED) {
    return { status: "not_approved" as const };
  }

  if (rentalRequest.payments.length > 0) {
    return { status: "already_paid" as const };
  }

  const stripe = getStripeClient();
  const amountInCents = toStripeAmount(rentalRequest.property.price);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "bdt",
    metadata: {
      rentalRequestId: rentalRequest.id,
      tenantId: userId,
    },
    payment_method_types: ["card"],
  });

  const payment = await prisma.payment.create({
    data: {
      amount: rentalRequest.property.price,
      transactionId: paymentIntent.id,
      method: "card",
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
      tenantId: userId,
      rentalRequestId: rentalRequest.id,
    },
    select: {
      id: true,
      amount: true,
      provider: true,
      status: true,
      transactionId: true,
      rentalRequestId: true,
      createdAt: true,
    },
  });

  return {
    status: "ok" as const,
    payment,
    clientSecret: paymentIntent.client_secret,
  };
}

export async function confirmPayment(userId: string, userRole: Role, input: ConfirmPaymentInput) {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: input.transactionId },
    select: {
      id: true,
      transactionId: true,
      tenantId: true,
      status: true,
      rentalRequestId: true,
      provider: true,
    },
  });

  if (!payment) {
    return { status: "not_found" as const };
  }

  if (payment.tenantId !== userId && userRole !== Role.ADMIN) {
    return { status: "forbidden" as const };
  }

  if (payment.provider !== PaymentProvider.STRIPE) {
    return { status: "unsupported_provider" as const };
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);

  if (paymentIntent.status !== "succeeded") {
    return {
      status: "not_completed" as const,
      stripeStatus: paymentIntent.status,
    };
  }

  const updatedPayment = await prisma.$transaction(async (tx:any) => {
    const savedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
      select: {
        id: true,
        amount: true,
        provider: true,
        status: true,
        transactionId: true,
        rentalRequestId: true,
        paidAt: true,
        updatedAt: true,
      },
    });

    await tx.rentalRequest.update({
      where: { id: payment.rentalRequestId },
      data: {
        status: RequestStatus.ACTIVE,
      },
    });

    return savedPayment;
  });

  return {
    status: "ok" as const,
    payment: updatedPayment,
  };
}

export async function getUserPayments(userId: string, userRole: Role) {
  return prisma.payment.findMany({
    where: userRole === Role.ADMIN ? {} : { tenantId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      transactionId: true,
      method: true,
      provider: true,
      status: true,
      paidAt: true,
      tenantId: true,
      rentalRequestId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPaymentById(paymentId: string, userId: string, userRole: Role) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      amount: true,
      transactionId: true,
      method: true,
      provider: true,
      status: true,
      paidAt: true,
      tenantId: true,
      rentalRequestId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!payment) {
    return { status: "not_found" as const };
  }

  if (payment.tenantId !== userId && userRole !== Role.ADMIN) {
    return { status: "forbidden" as const };
  }

  return {
    status: "ok" as const,
    payment,
  };
}