import { Router } from "express";

import { getAllUsers, updateTrustScore } from "../controllers/user.controller";

const router = Router();

router.get("/users", getAllUsers);

router.patch("/users/:id/trust", updateTrustScore);

export default router;
