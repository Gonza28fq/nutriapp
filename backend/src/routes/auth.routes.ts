import { Router } from "express";
import {
  AuthController,
  loginValidators,
  cambiarPasswordValidators,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login",           loginValidators,                              AuthController.login);
router.get("/me",               authMiddleware,                               AuthController.me);
router.put("/cambiar-password", authMiddleware, cambiarPasswordValidators,    AuthController.cambiarPassword);

export default router;