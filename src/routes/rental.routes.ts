import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
} from '../modules/rental/rental.controller.js';

const router = Router();

router.post("/", requireAuth, requireRole(Role.TENANT, Role.ADMIN), createRentalRequest);
router.get("/", requireAuth, requireRole(Role.TENANT, Role.ADMIN), getMyRentalRequests);
router.get("/:id", requireAuth, requireRole(Role.TENANT, Role.ADMIN), getRentalRequestById);

export default router;