import { Router } from "express";
import {
  getProperties,
  getPropertyById,
} from '../modules/property/property.controller.js';
import { requireAuth } from "../middlewares/auth.middleware.js";
requireAuth

const router = Router();

router.get("/", getProperties);
router.get("/:id", requireAuth, getPropertyById);

export default router;