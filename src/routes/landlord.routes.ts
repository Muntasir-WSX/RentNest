import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createLandlordProperty,
  deleteLandlordProperty,
  getLandlordRequests,
  updateLandlordProperty,
  updateLandlordRequestStatus,
} from '../modules/landlord/landlord.controller.js';

const router = Router();

router.post("/properties", requireAuth, requireRole(Role.LANDLORD, Role.ADMIN), createLandlordProperty);
router.put("/properties/:id", requireAuth, requireRole(Role.LANDLORD, Role.ADMIN), updateLandlordProperty);
router.delete("/properties/:id", requireAuth, requireRole(Role.LANDLORD, Role.ADMIN), deleteLandlordProperty);
router.get("/requests", requireAuth, requireRole(Role.LANDLORD, Role.ADMIN), getLandlordRequests);
router.patch("/requests/:id", requireAuth, requireRole(Role.LANDLORD, Role.ADMIN), updateLandlordRequestStatus);

export default router;