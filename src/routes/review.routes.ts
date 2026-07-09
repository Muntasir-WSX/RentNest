import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { createReview } from '../modules/review/review.controller.js';

const router = Router();

router.post("/", requireAuth, requireRole(Role.TENANT, Role.ADMIN), createReview);

export default router;