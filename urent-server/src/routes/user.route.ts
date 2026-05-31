import { Router } from "express";

import {
  deleteUser,
  getAllUsers,
  updateTrustScore,
  updateUserRole,
} from "../controllers/user.controller";
import { authGuard } from "../middlewares/auth.middleware";
import { adminGuard } from "../middlewares/admin-guard.middleware";

const router = Router();

router.get("/users", authGuard, adminGuard, getAllUsers);

router.patch("/users/:id/trust", authGuard, adminGuard, updateTrustScore);

router.patch("/users/:id/role", authGuard, adminGuard, updateUserRole);

router.delete("/users/:id", authGuard, adminGuard, deleteUser);

export default router;
