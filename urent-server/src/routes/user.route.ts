import { Router } from "express";

import {
  getAllUsers,
  updateTrustScore,
  updateUserRole,
} from "../controllers/user.controller";

const router = Router();

router.get("/users", getAllUsers);

router.patch("/users/:id/trust", updateTrustScore);

router.patch("/users/:id/role", updateUserRole);

export default router;
