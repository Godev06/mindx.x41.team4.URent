import { Router } from "express";

import {
  deleteUser,
  getAllUsers,
  updateTrustScore,
  updateUserRole,
} from "../controllers/user.controller";

const router = Router();

router.get("/users", getAllUsers);

router.patch("/users/:id/trust", updateTrustScore);

router.patch("/users/:id/role", updateUserRole);

router.delete("/users/:id", deleteUser);

export default router;
