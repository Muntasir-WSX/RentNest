import { Router } from "express";
import { register } from "../modules/auth/auth.controller";

const router = Router();

router.post("/register", register);

export default router;