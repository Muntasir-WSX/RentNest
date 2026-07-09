import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  confirmPaymentStatus,
  createPayment,
  listPayments,
  paymentDetails,
} from '../modules/payment/payment.controller.js';

const router = Router();

router.post("/create", requireAuth, requireRole(Role.TENANT, Role.ADMIN), createPayment);
router.post("/confirm", requireAuth, requireRole(Role.TENANT, Role.ADMIN), confirmPaymentStatus);
router.get("/", requireAuth, listPayments);
router.get("/:id", requireAuth, paymentDetails);

export default router;